import prisma from "../../prisma";
import data from "../../../data/12_15.json";

/**
 * add the last messages to the database
 * @param lastMessages List of lastMessage items from JSON
 */
async function addLastMessages(lastMessages: any[]) {
    const createMany = await prisma.lastMessage.createMany({
        data: lastMessages,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' lastMessages');
}
const lastMessages = data.map((post) => {
    return {
        id: post.conversation.lastMessage.id,
        anonymousLevel: post.conversation.lastMessage.anonymousLevel,
        authorSlug: post.conversation.lastMessage.author.slug,
        createdAt: post.conversation.lastMessage.createdAt,
        updatedAt: post.conversation.lastMessage.updatedAt,
        type: post.conversation.lastMessage.type,
    };
});
addLastMessages(lastMessages);