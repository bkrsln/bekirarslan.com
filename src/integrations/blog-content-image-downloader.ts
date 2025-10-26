import type { AstroIntegration } from 'astro'
import { getAllPosts, getAllBlocksByBlockId, downloadFile } from '../lib/notion/client'

export default (): AstroIntegration => ({
  name: 'blog-content-image-downloader',
  hooks: {
    'astro:build:start': async () => {
      const posts = await getAllPosts()
      
      console.log('Downloading blog content images...')
      
      const imageUrls = new Set<string>()
      
      // Tüm postların bloklarını al ve image URL'lerini topla
      for (const post of posts) {
        try {
          const blocks = await getAllBlocksByBlockId(post.PageId)
          
          for (const block of blocks) {
            if (block.Type === 'image' && block.Image) {
              let imageUrl = ''
              
              if (block.Image.External) {
                imageUrl = block.Image.External.Url
              } else if (block.Image.File) {
                imageUrl = block.Image.File.Url
              }
              
              if (imageUrl) {
                imageUrls.add(imageUrl)
              }
            }
          }
        } catch (error) {
          console.log(`Error processing post ${post.Title}:`, error)
        }
      }
      
      console.log(`Found ${imageUrls.size} unique images to download`)
      
      // Tüm image'ları indir
      const downloadPromises = Array.from(imageUrls).map(async (imageUrl) => {
        try {
          const url = new URL(imageUrl)
          await downloadFile(url)
          console.log(`Downloaded: ${url.pathname}`)
        } catch (error) {
          console.log(`Failed to download ${imageUrl}:`, error)
        }
      })
      
      await Promise.all(downloadPromises)
      console.log('Blog content image download completed!')
    },
  },
})