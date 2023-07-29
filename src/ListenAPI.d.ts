import { LoadingSceneUpdate, Scenes, Song } from './@types';



export type ListenAPI = {
  changeScene: (scene: Scenes) => void,

  "loadingScene::setTitle": (title: string) => void,
  "loadingScene::update": (update: LoadingSceneUpdate) => void,

  "error::setMessage": (msg: string) => void,
  "queue::songChanged": (song: Song) => void,
  "queue::created": () => void,
  "queue::destroyed": () => void,

  "songView::reset": () => void,
}