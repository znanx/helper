class Helper {
   isUrl = (url: string): boolean => {
      try {
         new URL(url)
         return true
      } catch {
         return false
      }
   }

   uuid = (length: number): string => {
      let result = ''
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      const charactersLength = characters.length
      for (let i = 0; i < length; i++) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
   }
}

const helper = new Helper

export { helper }
export default helper