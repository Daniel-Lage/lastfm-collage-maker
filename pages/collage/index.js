import Head from "next/head";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Jimp from "jimp";

class CollageBlueprint {
  constructor(limit = 0, start = 0, end = 0, ratio = 0) {
    this.limit = limit;
    this.start = start;
    this.end = end;
    this.ratio = ratio;
  }

  set(limit, start, end, ratio) {
    this.limit = limit;
    this.start = start;
    this.end = end;
    this.ratio = ratio;
  }
}

function getBlueprint(aspectRatio) {
  var closest = new CollageBlueprint();

  var height;
  var albums;
  var ratio;

  for (let end = 1; end < 50; end++) {
    for (let start = 1; start < end; start++) {
      height = 0;
      albums = 0;

      for (let index = start; start < end + 1; start++) {
        albums += index;
        height += start / index;
      }

      if (albums <= aspectRatio || albums > 100) continue;

      ratio = start / height;
      if (
        Math.abs(aspectRatio - ratio) < Math.abs(aspectRatio - closest.ratio)
      ) {
        closest.set(albums, start, end, ratio);
      }
    }
  }

  return closest;
}

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef();

  useEffect(() => {
    const { ratio } = router.query;

    const blueprintOptions = {
      phone: new CollageBlueprint(44, 2, 9, 0.5467563462790194),
      square: new CollageBlueprint(39, 4, 9, 1.00438421681945),
      standard: new CollageBlueprint(35, 5, 9, 1.341138903672166),
      hd: new CollageBlueprint(45, 7, 11, 1.7547635627017788),
      cinema: new CollageBlueprint(18, 5, 7, 1.9626168224299063),
      screen: getBlueprint(screen.width / screen.height),
    };

    const blueprint = blueprintOptions[ratio];

    const albums = require("../../components/albums.json");

    const canvas = canvasRef.current;

    canvas.width = blueprint.start * 300;
    canvas.height = Math.ceil((blueprint.start / blueprint.ratio) * 300);

    const ctx = canvas.getContext("2d");
    fetch(albums[0].image[3]["#text"], {
      method: "GET",
      mode: "cors",
    })
      .then((response) => {
        if (response.ok) return response.blob();
      })
      .then((blob) => {
        createImageBitmap(blob).then((image) => {
          ctx.drawImage(image, 0, 0, 300, 300);
        });
      });

    // createCollage(blueprintOptions[ratio]);
  }, [router]);

  function createCollage(blueprint) {
    const { user, period } = router.query;

    if (!blueprint?.limit) return;
    if (period === undefined) return;
    if (user === undefined) return;

    fetch(
      "https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&api_key=df0373523543e987dd095adaa12ea8e6&format=json&" +
        new URLSearchParams({
          limit: blueprint.limit,
          period,
          user,
        }).toString(),
      { method: "GET", mode: "cors" }
    )
      .then((response) => response.json())
      .then((body) => {
        if (body.error) {
          return console.error(body.message);
        }
        var index = 0;
        var height = 0;
        var size = 0;

        for (
          let albumsInRow = blueprint.start;
          albumsInRow < blueprint.end + 1;
          albumsInRow++
        ) {
          size = Math.ceil((blueprint.start * 300) / albumsInRow);

          for (let albumIndex = 0; albumIndex < albumsInRow - 1; albumIndex++) {
            fetch(body.topalbums.album[index].image[3]["#text"], {
              method: "GET",
              mode: "cors",
            });
            index += 1;
          }

          height += size;
        }
      });
  }

  return (
    <>
      <Head>
        <title>Collage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <canvas ref={canvasRef}></canvas>
    </>
  );
}
