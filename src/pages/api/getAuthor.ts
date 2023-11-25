import { Author } from "@prisma/client";
import prisma from "../../typescript/prisma";

/**
 * @description Get Author by slug (unique key in database schema)
 * @param slug 
 * @returns Promise of returned Author
 */
const getAuthor = async (slug: string): Promise<Author | null> => {
    const author = await prisma.author.findUnique({
        where: {
            slug: slug
        },
        select: {
            firstName: true,
            lastName: true,
            slug: true,
        }
    });
    return Promise.resolve(author);
}

export default getAuthor;