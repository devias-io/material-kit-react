import axios from "axios";

// define the getTopContributors function endpoint
export const getTopContributors = async (
  startDate: Date = new Date(2022, 8, 5),
  endDate: Date = new Date(2022, 11, 20),
  count: number = 5
) => {
  const slug = "01C723UAB";
  const response = await axios
    .get("/api/getAuthor", {
      params: {
        slug,
      },
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })
    .catch((error) => {
      console.error(error);
    });

  return response?.data;
};
