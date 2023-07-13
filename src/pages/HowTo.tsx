import { FunctionComponent } from "preact"

export const HowTo: FunctionComponent = () => {
  return (
    <div
      style={
        "display: flex; flex-direction: column; max-width: 750px; margin: 0 auto; gap: 10px;"
      }
    >
      <h1>Hello!</h1>
      So here's how it works: First, you make a smart playlist on Apple Music
      with all your songs you've listened to at least some (small, perhaps 0)
      number of times.
      <img src="/makeSmart.png"></img>
      <img src="/rules.png"></img>
      Next, go to the playlist you just made and reconfigure the view type to be
      "Songs" instead of "Playlist" from the top "View" menu.
      <img src="/playlistView.png"></img>
      <img src="/songView.png"></img>
      Finally, adjust the columns. Start by removing the Love column. Right
      click on the "Love" column and uncheck "Love" from the drop down to remove
      it.
      <img src="/love.png"></img>
      Then, add a Year column. Right click to the right of the "Plays" column
      and check "Year".
      <img src="/year.png"></img>
      The order of the columns <b style={"display: contents"}>must</b> be Title,
      Time, Artist, Album, Genre, Plays, Year. Any other order or different
      columns will not work.
      <img src="/order.png"></img>
      You're done! Use Cmd+A to select all the songs, then Cmd+C to copy them
      into your clipboard. (Have a ton of songs here? You may get better
      performance by sorting by play count then limiting your selection to a few
      thousand. )<img src="/selected.png"></img>
      <a href="/">Home</a>
      Note: Listen somehow else? The site expects your clipboard to have this
      data in a simple tab separated values format. If you can manage to get
      that out of your provider and into your clipboard, everything should be
      smooth sailing from there. Reach out on{" "}
      <a
        href="https://github.com/JacksonKearl/apple-music-stats"
        style="display: contents"
      >
        GitHub
      </a>{" "}
      if you have something to say!
    </div>
  )
}
