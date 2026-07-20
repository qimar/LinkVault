import { ExternalLink } from "lucide-react"

export function getIconForUrl(url: string, className: string = "w-5 h-5") {
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.04H5.078z"/>
      </svg>
    )
  }
  
  if (lowerUrl.includes("instagram.com")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  }
  
  if (lowerUrl.includes("github.com")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    )
  }
  
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.582 6.186a2.625 2.625 0 0 0-1.846-1.859C18.105 3.895 12 3.895 12 3.895s-6.105 0-7.736.432A2.625 2.625 0 0 0 2.418 6.186C2 7.828 2 12 2 12s0 4.172.418 5.814a2.625 2.625 0 0 0 1.846 1.859c1.631.432 7.736.432 7.736.432s6.105 0 7.736-.432a2.625 2.625 0 0 0 1.846-1.859C22 16.172 22 12 22 12s0-4.172-.418-5.814zM9.885 15.381V8.619L15.83 12l-5.945 3.381z"/>
      </svg>
    )
  }
  
  return <ExternalLink className={className} />
}
