import prisma from '../prisma';
import data from '../data/12_15.json';

// file to add in the corresponding data from the json files

/**
 * Add all the authors to the database of authors
 * @param authors List of author items from JSON
 * @returns
 */
async function addAuthors(authors: any[]) {
    const createMany = await prisma.author.createMany({
        data: authors,
        skipDuplicates: true,
    });
    console.log('created ' + createMany.count + ' authors');
}

const authors: any[] = [];

data.forEach((post) => {
    // add the author of each post
    authors.push({
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        slug: post.author.slug,
    });
    // add the commentors of each post
    post.comments.forEach((comment) => {
        // some comment sections are empty
        if (post.comments.length !== 0) {
            authors.push({
                firstName: comment.author.firstName,
                lastName: comment.author.lastName,
                slug: comment.author.slug,
            });
        }
    });
});

addAuthors(authors);
