import { useState } from "preact/hooks"
import { FunctionComponent } from "preact"
import { Bar } from "react-chartjs-2"
import { ChartData, ChartDataset, ChartOptions } from "chart.js"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from "chart.js"

import myData from "../assets/data.json"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

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
  minPlays: number
  data: typeof myData
}> = ({ breakout, primary, quantifier, minPlays, data: rawData }) => {
  const record: Record<string, ItemData> = {}
  const primarySortKey: Record<string, number> = {}
  const totalSortKey: Record<string, number> = {}

  for (const datum of rawData) {
    if (+datum.count < minPlays) continue

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
    v.playTime = Math.round((v.playTime / 60 / 60) * 10) / 10
  }

  const es = Object.entries(record)
  es.sort(([, a], [, b]) => primarySortKey[b.key] - primarySortKey[a.key])
  const sorted = es.slice(0)

  const secondaryLabels = new Set<string>()
  const primaryLabels = new Set<string>()

  const datasets: ChartDataset<"bar">[] = []

  for (const item of sorted) {
    primaryLabels.add(item[1].key)
    secondaryLabels.add(item[1].secondary)
  }
  let labels
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

  // const labels = primary === "year" ? [...primaryLabels] : [...primaryLabels]
  const indexLookup: Record<string, number> = {}
  labels.forEach((l, i) => (indexLookup[l] = i))

  for (const item of sorted) {
    const data = []
    const index = indexLookup[item[1].key]
    data[index] = item[1][quantifier]
    datasets.push({
      label: item[1].secondary,
      data,
      order: -totalSortKey[item[0]],
      backgroundColor: stringToColor(item[1].secondary),
    })
  }

  console.log({
    primaryLabels,
    secondaryLabels,
    datasets,
    sortKey: primarySortKey,
  })

  const options: ChartOptions<"bar"> = {
    plugins: {},
    maintainAspectRatio: false,
    indexAxis: "y",
    responsive: true,
    resizeDelay: 250,
    animation: false,
    scales: {
      x: {
        stacked: true,
        position: "top",
      },
      y: {
        stacked: true,
      },
    },
  }

  const maxLabelLength = 25
  const data: ChartData<"bar"> = {
    labels: labels.map((l) =>
      l.length < maxLabelLength ? l : l.slice(0, maxLabelLength - 1) + "\u2026",
    ),
    datasets,
  }

  return (
    <div style={`flex-grow: 1; min-height: ${labels.length * 20}px`}>
      <Bar data={data} options={options}></Bar>
    </div>
  )
}

export function Home() {
  const [uploaded, setUploaded] = useState(false)
  const [data, setData] = useState(myData)

  const [minPlays, setMinPlays] = useState(10)
  const minPlaysInput = (
    <input
      type="number"
      min={0}
      step={1}
      value={minPlays}
      style={"width: 32px"}
      onChange={(e) => setMinPlays(+e.currentTarget.value)}
    ></input>
  )

  const [primary, setPrimary] = useState<Field>("artist")
  const [breakout, setBreakout] = useState<Field>("album")

  const [quantifier, setQuantifier] = useState<Quantifier>("playTime")
  const valueSelector = (
    <select
      value={quantifier}
      onChange={(e) => setQuantifier(e.currentTarget.value as Quantifier)}
    >
      <option value="playTime">Hours Played</option>
      <option value="playCount">Times Played</option>
      <option value="songCount">Distinct Songs</option>
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
        .<br />
        Only considering songs with at least {minPlaysInput} plays (lowering
        this can make things sloooow).
        <br />
        {uploaded ? "Using data from clipboard." : "Using default data."}{" "}
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
            console.log({ data })
            setData(data)
            setUploaded(true)
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
        minPlays={minPlays}
        data={data}
      ></App>
    </>
  )
}
