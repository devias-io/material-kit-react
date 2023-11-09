import prisma from "../../prisma";
import data from "../../../data/12_15.json";

/**
 * add the last messages to the database
 * @param posts List of post items from JSON
 */
async function addPosts(posts: any[]) {
    const createMany = await prisma.post.createMany({
        data: posts,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' posts');
}

const posts = data.map((post) => {
    return {
        id: post.id,
        categoryId: post.categoryId,
        title: post.title,
        body: post.body,
        anonymous: post.anonymous ?? false,
        published: post.published,
        publishedAt: post.publishedAt,
        group: post.group,
        number: post.number,
        type: post.type,
        visibility: post.visibility,
        slug: post.slug,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        answersCount: post.answersCount ?? 0,
        uniqueViewsCount: post.uniqueViewsCount,
        viewsCount: post.viewsCount,
        answeredAt: post.answeredAt,
        modAnsweredAt: post.modAnsweredAt,
        read: post.read ?? false,
        authorSlug: post.author.slug,
        conversationSlug: post.conversation.slug,
    };
});

addPosts(posts);
