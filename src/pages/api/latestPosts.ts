import prisma from "../../typescript/prisma";
import { Post } from ".prisma/client";

interface PostData {
  slug: string;
  title: string;
  body: string;
}

const getLatestPosts = async (count: number = 3) => {
  try {
    const latestPosts = await prisma.post
      .findMany({
        where: {
          // filter out private posts
          NOT: [
            {
              body: {
                startsWith: "zzz",
              },
            },
          ],
        },
        take: count,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          title: true,
          body: true,
          slug: true,
        },
      })
      .then((data: PostData[]) =>
        data.map((post: PostData) => ({
          // get desired fields from post
          category: post.slug,
          title: post.title,
          body: post.body,
        }))
      );

    return Promise.resolve(latestPosts);
  } catch (error: any) {
    return Promise.reject(error);
  }
};

export default getLatestPosts;
