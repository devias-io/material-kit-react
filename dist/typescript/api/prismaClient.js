"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var topContributors_1 = __importDefault(require("./topContributors"));
var result = (0, topContributors_1.default)().then(function (res) {
    console.log(res);
});
// async function getTopContributors(count: number = 5) {
//     const top = await prisma.author.findMany({
//         take: count,
//         orderBy: {
//             Comment: {
//                 _count: 'desc',
//             },
//         },
//     });
//     console.log(top);
// }
// getTopContributors();
// async function getTopPosts(count: number = 5) {
//     const top = await prisma.post.findMany({
//         take: count,
//         orderBy: {
//             viewsCount: 'desc',
//         },
//     });
//     console.log(top);
// }
// getTopPosts();
