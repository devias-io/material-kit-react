import prisma from "../prisma";
import data from "../data/12_15.json";

/**
 * add the last messages to the database
 * @param conversations List of post items from JSON
 */
async function addConversations(conversations: any[]) {
    const createMany = await prisma.conversation.createMany({
        data: conversations,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' conversations');
}

const conversations = data.map((post) => {
    return {
        name: post.conversation.name,
        slug: post.conversation.slug,
        type: post.conversation.type,
        public: post.conversation.public,
        firstMessageId: post.conversation.firstMessage.id,
        lastMessageId: post.conversation.lastMessage.id,
    };
});

addConversations(conversations);
