/**
 * top contributors client file to get Data
 * from Supabase to solve the top contributor
 * question for the front-end
 */
import prisma from '../prisma';

const getTopContributors = async (
    startDate: Date = new Date(2022, 8, 5), // Default start date of September 5th, 2022 (0-based indices for month)
    endDate: Date = new Date(2022, 11, 20), // Default end date of December 20th, 2022 (0-based indices for month)
    count: number = 5
): Promise<any[]> => {
    console.log(startDate, endDate);
    const top = (await prisma.$queryRaw`
        SELECT a.slug, 
        COUNT(DISTINCT c.id) + 
        COUNT(DISTINCT p.id) + 
        COUNT(DISTINCT lm.id) as "totalCount"
        FROM "Author" a
        LEFT JOIN "Comment" c 
            ON a.slug = c."authorSlug" AND c."createdAt" BETWEEN ${startDate} AND ${endDate}
        LEFT JOIN "Post" p 
            ON a.slug = p."authorSlug" AND p."createdAt" BETWEEN ${startDate} AND ${endDate}
        LEFT JOIN "LastMessage" lm 
            ON a.slug = lm."authorSlug" AND lm."createdAt" BETWEEN ${startDate} AND ${endDate}            
        GROUP BY a.slug
        ORDER BY "totalCount" DESC
        LIMIT ${count}
    `) as any[];
    return Promise.resolve(top);
}

export default getTopContributors;
