// set up general data fetching commands with prisma client
import prisma from '../prisma';

async function getTopContributors(count: number = 5) {
    const top = await prisma.author.findMany({
        take: count,
        orderBy: {
            Comment: {
                _count: 'desc',
            },
        },
    });
    console.log(top);
}

getTopContributors();

async function getTopPosts(count: number = 5) {
    const top = await prisma.post.findMany({
        take: count,
        orderBy: {
            viewsCount: 'desc',
        },
    });
    console.log(top);
}

getTopPosts();
