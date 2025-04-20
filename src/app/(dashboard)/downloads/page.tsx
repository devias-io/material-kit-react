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
    <div className=" mx-auto">
      <h1 className="text-3xl font-bold mb-8">Trading Platforms</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="bg-card dark:bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border"
          >
            <div className="flex items-center gap-3 mb-4">
              <platform.icon className="w-8 h-8 text-primary-purple" />
              <h2 className="text-2xl font-semibold text-foreground">
                {platform.name}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">{platform.description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {platform.downloads.map((download) => (
                <a
                  key={download.os}
                  href={download.link}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-colors flex-1"
                >
                  <download.icon className="w-5 h-5" />
                  <span>Download for {download.os}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadsPage;
