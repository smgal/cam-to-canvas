// 추가적으로 여기의 API를 확인해보자
// https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API

(() => {
  const VIEW_W = 640;
  const VIEW_H = 480;

  const video = document.querySelector('#video');
  const canvas = document.getElementById('canvas');

  async function getMedia(constraints) {
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);

      if ("srcObject" in video) {
        video.srcObject = stream;
      } else {
        video.src = window.URL.createObjectURL(stream);
      }

      video.onloadedmetadata = (e) => {
        video.play();
      };
    } catch (err) {
      console.error(`navigator.mediaDevices.getUserMedia() error: ${err.name} - ${err.message}`);
    }
  }

  function Canvas_OnDraw(video, context, width, height) {
    // console.log(`Video type: ${typeof video}`);
    // console.log(`Video size: ${video.videoWidth} x ${video.videoHeight}`);

    context.drawImage(video, 0, 0, width, height);

    let image = context.getImageData(0, 0, width, height);
    let data = image.data;

    // 흑백 필터
    for (let i = 0; i < data.length; i += 4) {
      const intensity = (data[i] * 3 + data[i + 1] * 6 + data[i + 2]) / 10;
      data[i] = data[i + 1] = data[i + 2] = intensity;
    }

    // 포커스
    const pitch = width * 4;
    for (let i = 0; i < 10; i++) {
      for (let y = 0; y < height; y += 1) {
        if (y > 0 && y < height - 1) {
          for (let x = 0; x < width; x += 1) {
            const x_dist = Math.abs(x - width / 2);
            const y_dist = Math.abs(y - height / 2);
            const radius = Math.sqrt(x_dist * x_dist + y_dist * y_dist);

            if (radius - 130 > i * 20) {
              if (x > 0 && x < width - 1) {
                const ix_2 = (pitch * y) + (x - 1) * 4;
                const ix_1 = ix_2 - pitch;
                const ix_3 = ix_2 + pitch;

                const r = (data[ix_1 + 0] + data[ix_1 + 4] + data[ix_1 + 8] + data[ix_2 + 0] + data[ix_2 + 4] + data[ix_2 + 8] + data[ix_3 + 0] + data[ix_3 + 4] + data[ix_3 + 8]) / 9;
                const g = (data[ix_1 + 1] + data[ix_1 + 5] + data[ix_1 + 9] + data[ix_2 + 1] + data[ix_2 + 5] + data[ix_2 + 9] + data[ix_3 + 1] + data[ix_3 + 5] + data[ix_3 + 9]) / 9;
                const b = (data[ix_1 + 2] + data[ix_1 + 6] + data[ix_1 + 10] + data[ix_2 + 2] + data[ix_2 + 6] + data[ix_2 + 10] + data[ix_3 + 2] + data[ix_3 + 6] + data[ix_3 + 10]) / 9;
                const a = (255 - (radius - 150) > 255) ? 255 : 255 - (radius - 150);

                data[ix_2 + 4] = r;
                data[ix_2 + 5] = g;
                data[ix_2 + 6] = b;
                data[ix_2 + 7] = a;
              }
            }
          }
        }
      }
    }

    context.putImageData(image, 0, 0);

    // if (!video.video.paused && !video.video.ended)
    setTimeout(Canvas_OnDraw, 10, video, context, width, height);
  }

  // Video 연결
  const constraints = { audio: false, video: { width: { min: VIEW_W }, height: { min: VIEW_H } } };
  getMedia(constraints);

  // Canvas 연결
  const context = canvas.getContext('2d');
  video.addEventListener('play', () => {
    Canvas_OnDraw(video, context, VIEW_W, VIEW_H);
  },
    false
  );
})();
