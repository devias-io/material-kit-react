import Description from "@/components/layout/description";
import Title from "@/components/layout/title";
import { Apple, BarChart, Laptop, LineChart } from "lucide-react";
import React from "react";

const DownloadsPage = () => {
  const platforms = [
    {
      name: "MetaTrader 4",
      icon: LineChart,
      description:
        "The world's most popular trading platform for forex and CFDs",
      downloads: [
        {
          os: "Windows",
          icon: Laptop,
          link: "#",
        },
        {
          os: "MacOS",
          icon: Apple,
          link: "#",
        },
      ],
    },
    {
      name: "MetaTrader 5",
      icon: BarChart,
      description: "Next-generation trading platform with advanced features",
      downloads: [
        {
          os: "Windows",
          icon: Laptop,
          link: "#",
        },
        {
          os: "MacOS",
          icon: Apple,
          link: "#",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#040a14]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Title title="Trading Platforms" />
          <Description description="Download our supported trading platforms" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="dark:dark-card bg-white dark:bg-gradient-to-br 
                      dark:from-[#062f3a] dark:to-[#083c5a] 
                      rounded-xl p-6 border border-gray-200 
                      dark:border-[#12e9ee]/10 
                      shadow-lg dark:shadow-[#12e9ee]/5 
                      hover:shadow-xl dark:hover:shadow-[#12e9ee]/10 
                      transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-3 rounded-lg bg-[#486ebb]/10 
                            dark:bg-[#486ebb]/20"
                >
                  <platform.icon
                    className="w-8 h-8 text-[#486ebb] 
                                       dark:text-[#486ebb]"
                  />
                </div>
                <div>
                  <h2
                    className="text-2xl   font-semibold 
                             text-gray-900 dark:text-[#f6f9fa]"
                  >
                    {platform.name}
                  </h2>
                  <p
                    className="text-gray-600 dark:text-[#f6f9fa]/70 
                              mt-1"
                  >
                    {platform.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {platform.downloads.map((download) => (
                  <a
                    key={download.os}
                    href={download.link}
                    className="flex items-center justify-center gap-2 
                           px-4 py-3 bg-teal-500 dark:bg-[#12e9ee] 
                           text-white dark:text-[#040a14] rounded-lg 
                           hover:bg-teal-600 dark:hover:bg-[#12e9ee]/90 
                           transition-all duration-300 flex-1 
                             dark:glow-teal 
                           group relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 dark:bg-gradient-to-r 
                                dark:from-[#12e9ee]/0 
                                dark:via-[#12e9ee]/10 
                                dark:to-[#12e9ee]/0 
                                transform -skew-x-12 
                                opacity-0 group-hover:opacity-100 
                                transition-opacity duration-700"
                    />
                    <download.icon
                      className="w-5 h-5 
                                         group-hover:scale-110 
                                         transition-transform 
                                         duration-300"
                    />
                    <span className="relative z-10">
                      Download for {download.os}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information Section */}
        <div
          className="mt-12 dark:dark-card bg-white 
                     dark:bg-gradient-to-br dark:from-[#062f3a] 
                     dark:to-[#083c5a] rounded-xl p-6 
                     border border-gray-200 dark:border-[#12e9ee]/10"
        >
          <h3
            className="text-xl   font-semibold 
                      text-gray-900 dark:text-[#f6f9fa] mb-4"
          >
            System Requirements
          </h3>
          <div
            className="grid md:grid-cols-2 gap-6 
                        "
          >
            <div className="space-y-2">
              <h4
                className="text-gray-900 dark:text-[#f6f9fa] 
                         font-medium"
              >
                Windows
              </h4>
              <ul
                className="list-disc list-inside space-y-1 
                          text-gray-600 dark:text-[#f6f9fa]/70"
              >
                <li>Windows 7 or higher</li>
                <li>2 GB RAM minimum</li>
                <li>1 GHz processor</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4
                className="text-gray-900 dark:text-[#f6f9fa] 
                         font-medium"
              >
                MacOS
              </h4>
              <ul
                className="list-disc list-inside space-y-1 
                          text-gray-600 dark:text-[#f6f9fa]/70"
              >
                <li>macOS 10.13 or higher</li>
                <li>4 GB RAM minimum</li>
                <li>Intel or Apple Silicon processor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
