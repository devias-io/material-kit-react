import prisma from '../prisma';
import data from '../data/12_15.json';

/**
 * add the comments to the database
 * @param comments List of comment items from JSON
 */
async function addComments(comments: any[]) {
    const createMany = await prisma.comment.createMany({
        data: comments,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' comments');
}

const comments: any[] = [];

data.forEach((post) => {
    const postComments: any[] = post.comments;
    comments.push(
        ...postComments.map((comment) => {
            return {
                id: comment.id,
                body: comment.body,
                answer: comment.answer ?? false, // sometimes answer is undefined
                createdAt: comment.createdAt,
                publishedAt: comment.publishedAt,
                endorsed: comment.endorsed,
                depth: comment.depth,
                authorSlug: comment.author.slug,
                postSlug: post.slug
            };
        })
    );
});

addComments(comments);
