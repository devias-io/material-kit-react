[images]
  remote_images = ["https://source.unsplash.com/.*", "https://images.unsplash.com/.*", "https://ext.same-assets.com/.*", "https://ugc.same-assets.com/.*"]

[build]
  command = "bun run build"
  publish = ".next"

[build.environment]
  NETLIFY_NEXT_PLUGIN_SKIP = "true"

[[plugins]]
  package = "@netlify/plugin-nextjs"