import { KVNamespace, PagesFunction } from "@cloudflare/workers-types"
import { hash } from "./hashRand"

type Env = {
  STORE: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return new Response("no", { status: 400 })
  }
  const data = await env.STORE.get(url.searchParams.get("id")!)
  if (!data) {
    return new Response("no", { status: 404 })
  }
  return new Response(data)
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.json()
  if (!Array.isArray(body)) {
    return new Response("bad", { status: 400 })
  }
  const toStore = []
  for (const datum of body) {
    toStore.push({
      name: datum.name,
      time: datum.time,
      artist: datum.artist,
      album: datum.album,
      genre: datum.genre,
      count: datum.count,
      year: datum.year,
    })
  }
  const str = JSON.stringify(toStore)
  const key = hash(str)
  await env.STORE.put(key, str)

  return new Response(key)
}
