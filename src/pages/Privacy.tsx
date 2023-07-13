import { FunctionComponent } from "preact"

export const Privacy: FunctionComponent = () => {
  return (
    <div
      style={
        "display: flex; flex-direction: column; max-width: 750px; margin: 0 auto; gap: 10px;"
      }
    >
      <h1>Hello!</h1>
      <p>
        This site uses{" "}
        <a href="https://www.cloudflare.com/web-analytics/">
          Cloudflare Web Analytics
        </a>{" "}
        for privacy-perserving analytics.
      </p>
      <p>
        No personal data is collected unless you choose to upload your data as
        part of making a shareable link. In the event you do upload your data,
        it is stored indefinitely in{" "}
        <a href="https://www.cloudflare.com/products/workers-kv/">
          Cloudflare KV
        </a>.
      </p>
      <p>Uploaded data may be used and/or published for future feature development.</p>
      <a href="/">Home</a>
      <p>
        Reach out on{" "}
        <a href="https://github.com/JacksonKearl/apple-music-stats">GitHub</a>{" "}
        if you have something to say!
      </p>
    </div>
  )
}
