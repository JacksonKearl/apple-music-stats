import { useMemo, useState } from "preact/hooks"
import { FunctionComponent } from "preact"
import Plot from "react-plotly.js"

// const useLocalState = <T extends string>(name: string, start: T) => {
//   const [internal, setInternal] = useState<T>(
//     (localStorage.getItem(name) ?? start) as T,
//   )
//   const setAll = (v: T) => {
//     if (v && v !== start) {
//       localStorage.set(name, v)
//     } else {
//       localStorage.delete(name)
//     }
//     setInternal(v)
//   }
//   return [internal, setAll]
// }

const useQueryState = <T extends string>(
  name: string,
  start: T,
): [T, (v: T) => void] => {
  const url = new URL(window.location.href)
  const [internal, setInternal] = useState<T>(
    (url.searchParams.get(name) ?? start) as T,
  )

  const setAll = (v: T) => {
    const url = new URL(window.location.href)
    if (v && v !== start) {
      url.searchParams.set(name, v)
    } else {
      url.searchParams.delete(name)
    }
    window.history.replaceState(null, "null", url)
    setInternal(v)
  }

  return [internal, setAll]
}

import myData from "../assets/data.json"

type ItemData = {
  songCount: number
  playCount: number
  playTime: number
  key: string
  secondary: string
}

const stringToColor = (str: string) => {
  let hashCode = 0xdeadbeef
  for (let i = 0; i < str.length; i++) {
    hashCode = str.charCodeAt(i) + ((hashCode << 5) - hashCode)
  }
  for (let i = 0; i < str.length; i++) {
    hashCode = str.charCodeAt(i) + ((hashCode << 5) - hashCode)
  }
  for (let i = 0; i < str.length; i++) {
    hashCode = str.charCodeAt(i) + ((hashCode << 5) - hashCode)
  }
  for (let i = 0; i < str.length; i++) {
    hashCode = str.charCodeAt(i) + ((hashCode << 5) - hashCode)
  }

  const r = (hashCode & 0xff0000) >> 16
  const g = (hashCode & 0x00ff00) >> 8
  const b = hashCode & 0x0000ff

  return `rgb(${r}, ${g}, ${b})`
}

type Quantifier = "playTime" | "playCount" | "songCount"
type Field = "name" | "artist" | "album" | "genre" | "year"

const App: FunctionComponent<{
  primary: Field
  breakout: Field
  quantifier: Quantifier

  data: typeof myData
}> = ({ breakout, primary, quantifier, data: rawData }) => {
  const record: Record<string, ItemData> = {}
  const primarySortKey: Record<string, number> = {}
  const totalSortKey: Record<string, number> = {}

  for (const datum of rawData) {
    datum.artist = datum.artist.replace(/Kanye West/, "Ye")
    datum.album = datum.album.replace(/\s*\(.*\)/, "")
    datum.album = datum.album.replace(/\s*\[.*\]/, "")

    const key = datum[primary]
    const secondary = datum[breakout]

    if (!key || !secondary) continue

    const lookup = JSON.stringify({ key, secondary })
    record[lookup] = record[lookup] ?? {
      songCount: 0,
      playCount: 0,
      playTime: 0,
      key,
      secondary,
    }

    const [min, sec] = datum.time.split(":")

    record[lookup].songCount++
    const playCount = +datum.count
    record[lookup].playCount += playCount
    const playTime = playCount * (+min * 60 + +sec)
    record[lookup].playTime += +playTime

    const sortMetric = { songCount: 1, playCount, playTime }[quantifier]
    primarySortKey[key] = (primarySortKey[key] ?? 0) + sortMetric
    totalSortKey[lookup] = (totalSortKey[lookup] ?? 0) + sortMetric
  }

  for (const v of Object.values(record)) {
    v.playTime = v.playTime / 60 / 60
  }

  const es = Object.entries(record)
  es.sort(([, a], [, b]) => primarySortKey[b.key] - primarySortKey[a.key])
  const sorted = es.slice(0)

  const secondaryLabels = new Set<string>()
  const primaryLabels = new Set<string>()

  for (const item of sorted) {
    primaryLabels.add(item[1].key)
    secondaryLabels.add(item[1].secondary)
  }

  let labels: string[]
  if (primary === "year") {
    const years = [...primaryLabels].map((l) => +l)
    const min = Math.min(...years)
    const max = Math.max(...years)
    console.log({ min, max })
    labels = []
    for (let i = min; i <= max; i++) {
      labels.push("" + i)
    }
    labels.reverse()
  } else {
    labels = [...primaryLabels]
  }

  const indexLookup: Record<string, number> = {}
  labels.forEach((l, i) => (indexLookup[l] = i))

  const labelQuantifier = (v: number) =>
    ({
      playCount: breakout === "name" ? `${v} Plays` : `${v} Track Plays`,
      playTime: `${Math.round(v * 100) / 100} Hours Played`,
      songCount: `${v} Distinct Tracks`,
    }[quantifier])

  const plotlyData: Plotly.Data[] = sorted
    .map(([id, data]) => ({
      secondaryOrder: totalSortKey[id],
      primaryOrder: primarySortKey[data.key],
      data: {
        type: "bar",
        x: [data[quantifier]],
        y: [data.key],
        text: data.secondary,
        textposition: "inside",
        marker: { color: [stringToColor(data.secondary)] },
        orientation: "h",
        hovertext: `${data.secondary} | ${data.key} | ${labelQuantifier(
          data[quantifier],
        )}`,
        hoverinfo: "text",
      } satisfies Plotly.Data,
    }))
    .sort(({ secondaryOrder: a }, { secondaryOrder: b }) => b - a)
    .sort(({ primaryOrder: a }, { primaryOrder: b }) => b - a)
    .map(({ data }) => data)
  const maxLabelLength = 18

  const w = document.body.clientWidth
  const layout: Partial<Plotly.Layout> = {
    showlegend: false,
    barmode: "stack",

    margin: {
      l: primary === "year" ? 50 : 150,
      r: 20,
      b: 20,
      t: 20,
      pad: 4,
    },
    height: labels.length * 20,
    width: w,
    yaxis: {
      autorange: primary === "year" ? undefined : "reversed",
      ticktext: labels.map((label) =>
        label.length < maxLabelLength
          ? label
          : label.slice(0, maxLabelLength - 1) + "\u2026",
      ),
      tickvals: labels,
    },
    xaxis: {
      side: "top",
      ticksuffix: quantifier === "playTime" ? " hours" : "",
    },
  }

  // some bignum bullshit
  const UntypedPlot = Plot as any
  return (
    <div style={`flex-grow: 1; min-height: ${labels.length * 20}px`}>
      <UntypedPlot
        data={plotlyData}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
      ></UntypedPlot>
    </div>
  )
}

export function Home() {
  const [uuid, setUUID] = useQueryState<string>("id", "")
  const [source, setSource] = useState(uuid ? "saved" : "default")
  const [data, setData] = useState(uuid ? [] : myData)

  useMemo(async () => {
    if (uuid) {
      const resp = await fetch("/store?id=" + uuid)
      if (!resp.ok) {
        alert("There was an error accessing saved data.")
      } else {
        setData(await resp.json())
        setSource("saved")
      }
    }
  }, [uuid])

  const [primary, setPrimary] = useQueryState<Field>("main", "artist")
  const [breakout, setBreakout] = useQueryState<Field>("break", "album")
  const [quantifier, setQuantifier] = useQueryState<Quantifier>(
    "quant",
    "playTime",
  )

  const valueSelector = (
    <select
      value={quantifier}
      onChange={(e) => setQuantifier(e.currentTarget.value as Quantifier)}
    >
      <option value="playTime">Hours Played</option>
      <option value="playCount">Times Played</option>
      <option value="songCount">Distinct Tracks</option>
    </select>
  )

  const makeSelector = (v: string, sV: (v: Field) => void) => (
    <select value={v} onChange={(e) => sV(e.currentTarget.value as Field)}>
      <option value="name">Title</option>
      <option value="artist">Artist</option>
      <option value="album">Album</option>
      <option value="genre">Genre</option>
      <option value="year">Year</option>
    </select>
  )

  return (
    <>
      <p style={"padding: 5px"}>
        Grouped by {makeSelector(primary, setPrimary)}, broken out by{" "}
        {makeSelector(breakout, setBreakout)}, and quantified by {valueSelector}
        .
        <br />
        {source === "clipboard" ? (
          <>
            Using data from clipboard.{" "}
            <button
              onClick={async () => {
                const resp = await fetch("/store", {
                  method: "POST",
                  body: JSON.stringify(data),
                })
                if (!resp.ok) {
                  alert("There was an error uploading your data.")
                  return
                }
                const uuid = await resp.text()
                setUUID(uuid)
              }}
            >
              Upload for shareable link
            </button>
          </>
        ) : source === "default" ? (
          "Using default data."
        ) : (
          "Using saved data."
        )}{" "}
        <button
          onClick={async () => {
            const text = await navigator.clipboard.readText()
            const tsv = await navigator.clipboard.readText()
            const data = tsv
              .split(/\r|\n/)
              .map((l) => l.split("\t"))
              .map(([name, time, artist, album, genre, count, year]) => ({
                name,
                time,
                artist,
                album,
                genre,
                count,
                year,
              }))
              .filter(
                ({ name, artist, album, count }) =>
                  name && artist && album && count,
              )
            if (data.length) {
              console.log({ data })
              setUUID("")
              setData(data)
              setSource("clipboard")
            } else {
              alert("Error! Data in unexpected format. See instructions.")
            }
          }}
        >
          Import from clipboard (data stays local)
        </button>{" "}
        <a href="/howto">How Do I Extract Data from Apple Music (etc.)?</a>
      </p>
      <App
        primary={primary}
        breakout={breakout}
        quantifier={quantifier}
        data={data}
      ></App>
      <p style={"padding: 5px"}>
        This uses <a href="https://plotly.com/javascript/">plotly.js</a>, and{" "}
        <a href="https://preactjs.com/">preact</a>!{" "}
        <a href="https://github.com/JacksonKearl/apple-music-stats">
          View Source
        </a>
        {" | "}
        <a href="/privacy">Privacy Policy</a>
      </p>
    </>
  )
}
