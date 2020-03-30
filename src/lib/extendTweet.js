import flattenMultiline from "flatten-multiline"
import hasContent from "has-content"

export default tweet => {
  tweet.fullText = tweet.extended_tweet?.full_text || tweet.text
  tweet.flattenedText = flattenMultiline(tweet.fullText)
  tweet.shortLink = `twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
  tweet.link = `https://${tweet.shortLink}`
  if (hasContent(tweet.user.name) && !tweet.user.name.includes("@")) {
    tweet.authorTitle = tweet.user.name
  } else {
    tweet.authorTitle = tweet.user.screen_name
  }
}