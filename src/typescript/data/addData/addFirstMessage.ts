import prisma from '../../prisma';
import data from '../../../data/12_15.json';

/**
 * add the first messages to the database
 * @param firstMessages List of firstMessage items from JSON
 */
async function addFirstMessages(firstMessages: any[]) {
    const createMany = await prisma.firstMessage.createMany({
        data: firstMessages,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' firstMessages');
}

const firstMessages = data.map((post) => {
    return {
        id: post.conversation.firstMessage.id,
        anonymousLevel: post.conversation.firstMessage.anonymousLevel,
        createdAt: post.conversation.firstMessage.createdAt,
        updatedAt: post.conversation.firstMessage.updatedAt,
        type: post.conversation.firstMessage.type,
    }
});

addFirstMessages(firstMessages);