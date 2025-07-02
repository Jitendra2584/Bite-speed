import { IsNull, QueryRunner } from "typeorm";
import { AppDataSource } from "../data-source";
import { Contacts } from "../entity/contacts";
import { IdentifyRequest, IdentifyResponse } from "../zod";

class ContactService {
  async contactRepository(): Promise<QueryRunner> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  private async findMatchingContacts(
    queryRunner: QueryRunner,
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<Contacts[]> {
    const query = queryRunner.manager
      .getRepository(Contacts)
      .createQueryBuilder("contact")
      .where("contact.deletedAt IS NULL");

    if (email && phoneNumber) {
      query.andWhere(
        "(contact.email = :email OR contact.phoneNumber = :phoneNumber)",
        { email, phoneNumber }
      );
    } else if (email) {
      query.andWhere("contact.email = :email", { email });
    } else if (phoneNumber) {
      query.andWhere("contact.phoneNumber = :phoneNumber", { phoneNumber });
    }

    return query.orderBy("contact.createdAt", "ASC").getMany();
  }

  async identifyContact(body: IdentifyRequest): Promise<IdentifyResponse> {
    const queryRunner = await this.contactRepository();
    try {
      console.log("Identify Contact Service called with body:", body);

      const { email, phoneNumber } = body;

      // Step 1: Find all existing contacts that match email OR phoneNumber
      const existingContacts = await this.findMatchingContacts(
        queryRunner,
        email,
        phoneNumber
      );

      if (existingContacts.length === 0) {
        // No existing contacts - create new primary contact
        const newContact = await this.createNewPrimaryContact(
          queryRunner,
          email,
          phoneNumber
        );
        await queryRunner.commitTransaction();

        return {
          contact: {
            primaryContactId: newContact.id,
            emails: newContact.email ? [newContact.email] : [],
            phoneNumbers: newContact.phoneNumber
              ? [newContact.phoneNumber]
              : [],
            secondaryContactIds: [],
          },
        };
      }

      // Step 2: Check if exact contact already exists
      const exactMatch = await this.findExactContact(
        queryRunner,
        email,
        phoneNumber
      );
      if (exactMatch) {
        const allLinkedContacts = await this.getAllLinkedContacts(
          queryRunner,
          exactMatch
        );
        await queryRunner.commitTransaction();
        return this.formatResponse(allLinkedContacts);
      }

      // Step 3: Handle linking scenarios
      const result = await this.handleContactLinking(
        queryRunner,
        existingContacts,
        email,
        phoneNumber
      );
      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      console.error("Error in identifyContact:", error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async findExactContact(
    queryRunner: QueryRunner,
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<Contacts | null> {
    console.log(
      "Finding exact contact with email:",
      email,
      "and phone:",
      phoneNumber
    );
    const whereCondition: any = { deletedAt: null };

    if (email !== undefined) whereCondition.email = email;
    if (phoneNumber !== undefined) whereCondition.phoneNumber = phoneNumber;

    return queryRunner.manager
      .getRepository(Contacts)
      .findOne({ where: whereCondition });
  }

  private async createNewPrimaryContact(
    queryRunner: QueryRunner,
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<Contacts> {
    console.log(
      "Creating new primary contact with email:",
      email,
      "and phone:",
      phoneNumber
    );
    const newContact = queryRunner.manager.getRepository(Contacts).create({
      email,
      phoneNumber,
      linkedId: null,
      linkPrecedence: "primary",
    });

    return queryRunner.manager.getRepository(Contacts).save(newContact);
  }

  private async getAllLinkedContacts(
    queryRunner: QueryRunner,
    contact: Contacts
  ): Promise<Contacts[]> {
    console.log("Getting all linked contacts for contact ID:", contact.id);
    const primaryId =
      contact.linkPrecedence === "primary" ? contact.id : contact.linkedId!;

    return queryRunner.manager.getRepository(Contacts).find({
      where: [
        { id: primaryId, deletedAt: IsNull() },
        { linkedId: primaryId, deletedAt: IsNull() },
      ],
      order: { createdAt: "ASC" },
    });
  }

  private async handleContactLinking(
    queryRunner: QueryRunner,
    existingContacts: Contacts[],
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<IdentifyResponse> {
    console.log(
      "Handling contact linking for existing contacts:",
      existingContacts
    );
    // Separate primary and secondary contacts
    const primaryContacts = existingContacts.filter(
      (c) => c.linkPrecedence === "primary"
    );
    const secondaryContacts = existingContacts.filter(
      (c) => c.linkPrecedence === "secondary"
    );

    if (primaryContacts.length === 1) {
      // Single primary contact found - create new secondary
      const primaryContact = primaryContacts[0];

      // Check if we need to create a new secondary contact
      const hasNewInfo = this.hasNewInformation(
        existingContacts,
        email,
        phoneNumber
      );

      if (hasNewInfo) {
        await this.createSecondaryContact(
          queryRunner,
          email,
          phoneNumber,
          primaryContact.id
        );
      }

      const allLinkedContacts = await this.getAllLinkedContacts(
        queryRunner,
        primaryContact
      );
      return this.formatResponse(allLinkedContacts);
    } else if (primaryContacts.length > 1) {
      // Multiple primary contacts - need to merge
      const oldestPrimary = primaryContacts.reduce((oldest, current) =>
        current.createdAt < oldest.createdAt ? current : oldest
      );

      // Convert other primaries to secondaries
      for (const contact of primaryContacts) {
        if (contact.id !== oldestPrimary.id) {
          console.log("Converting contact ID:", contact.id, "to secondary");
          await queryRunner.manager.getRepository(Contacts).update(contact.id, {
            linkedId: oldestPrimary.id,
            linkPrecedence: "secondary",
          });
        }
      }

      // Create new secondary if needed
      const allContacts = [...primaryContacts, ...secondaryContacts];
      const hasNewInfo = this.hasNewInformation(
        allContacts,
        email,
        phoneNumber
      );

      if (hasNewInfo) {
        await this.createSecondaryContact(
          queryRunner,
          email,
          phoneNumber,
          oldestPrimary.id
        );
      }

      const allLinkedContacts = await this.getAllLinkedContacts(
        queryRunner,
        oldestPrimary
      );
      return this.formatResponse(allLinkedContacts);
    } else {
      // Only secondary contacts found - find their primary
      const primaryId = secondaryContacts[0].linkedId!;
      const primaryContact = await queryRunner.manager
        .getRepository(Contacts)
        .findOne({
          where: { id: primaryId, deletedAt: IsNull() },
        });

      if (!primaryContact) {
        throw new Error("Primary contact not found");
      }

      // Check if we need to create a new secondary contact
      const allLinked = await this.getAllLinkedContacts(
        queryRunner,
        primaryContact
      );
      const hasNewInfo = this.hasNewInformation(allLinked, email, phoneNumber);

      if (hasNewInfo) {
        await this.createSecondaryContact(
          queryRunner,
          email,
          phoneNumber,
          primaryContact.id
        );
      }

      const allLinkedContacts = await this.getAllLinkedContacts(
        queryRunner,
        primaryContact
      );
      return this.formatResponse(allLinkedContacts);
    }
  }

  private hasNewInformation(
    existingContacts: Contacts[],
    email?: string | null,
    phoneNumber?: string | null
  ): boolean {
    console.log(
      "Checking for new information with email:",
      email,
      "and phone:",
      phoneNumber
    );
    const existingEmails = existingContacts
      .map((c) => c.email)
      .filter(
        (email): email is string => email !== null && email !== undefined
      );

    const existingPhones = existingContacts
      .map((c) => c.phoneNumber)
      .filter(
        (phone): phone is string => phone !== null && phone !== undefined
      );

    const newEmail = email && !existingEmails.includes(email);
    const newPhone = phoneNumber && !existingPhones.includes(phoneNumber);

    return Boolean(newEmail || newPhone);
  }

  private async createSecondaryContact(
    queryRunner: QueryRunner,
    email?: string | null,
    phoneNumber?: string | null,
    primaryId?: number
  ): Promise<Contacts> {
    console.log(
      "Creating new secondary contact with email:",
      email,
      "and phone:",
      phoneNumber
    );
    const secondaryContact = queryRunner.manager
      .getRepository(Contacts)
      .create({
        email,
        phoneNumber,
        linkedId: primaryId,
        linkPrecedence: "secondary",
      });

    return queryRunner.manager.getRepository(Contacts).save(secondaryContact);
  }

  private formatResponse(contacts: Contacts[]): IdentifyResponse {
    console.log("Formatting response for contacts:", contacts);
    const primary =
      contacts.find((c) => c.linkPrecedence === "primary") || contacts[0];
    const secondaries = contacts.filter(
      (c) => c.linkPrecedence === "secondary"
    );

    // Collect unique emails and phone numbers, with primary first
    const emails = [
      ...(primary.email ? [primary.email] : []),
      ...secondaries
        .map((c) => c.email)
        .filter(
          (email): email is string => email !== null && email !== undefined
        ),
    ].filter((email, index, arr) => arr.indexOf(email) === index);

    const phoneNumbers = [
      ...(primary.phoneNumber ? [primary.phoneNumber] : []),
      ...secondaries
        .map((c) => c.phoneNumber)
        .filter(
          (phone): phone is string => phone !== null && phone !== undefined
        ),
    ].filter((phone, index, arr) => arr.indexOf(phone) === index);

    return {
      contact: {
        primaryContactId: primary.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaries.map((c) => c.id),
      },
    };
  }
}

// Export singleton instance
export const contactService = new ContactService();
