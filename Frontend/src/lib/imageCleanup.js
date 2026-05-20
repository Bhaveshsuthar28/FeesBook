export const checkerStyle = {
  backgroundColor: "#fff",
  backgroundImage:
    "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
  backgroundPosition:
    "0 0, 0 10px, 10px -10px, -10px 0",
  backgroundSize: "20px 20px",
};

export const cleanImageBackground =
  (file) =>
    new Promise(
      (resolve, reject) => {
        const image =
          document.createElement("img");
        const url =
          URL.createObjectURL(file);

        image.onload =
          () => {
            const canvas =
              document.createElement("canvas");
            canvas.width =
              image.width;
            canvas.height =
              image.height;

            const context =
              canvas.getContext("2d");
            context.drawImage(
              image,
              0,
              0
            );

            const imageData =
              context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
            const pixels =
              imageData.data;

            for (
              let index = 0;
              index < pixels.length;
              index += 4
            ) {
              const red =
                pixels[index];
              const green =
                pixels[index + 1];
              const blue =
                pixels[index + 2];
              const isLight =
                red > 220 &&
                green > 220 &&
                blue > 220;
              const isNearNeutral =
                Math.abs(red - green) < 18 &&
                Math.abs(red - blue) < 18 &&
                Math.abs(green - blue) < 18;

              if (
                isLight &&
                isNearNeutral
              ) {
                pixels[index + 3] =
                  0;
              }
            }

            context.putImageData(
              imageData,
              0,
              0
            );

            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(
                  url
                );

                if (!blob) {
                  reject(
                    new Error(
                      "Background cleanup failed"
                    )
                  );
                  return;
                }

                resolve(
                  new File(
                    [blob],
                    file.name.replace(
                      /\.[^.]+$/,
                      ".png"
                    ),
                    {
                      type:
                        "image/png",
                    }
                  )
                );
              },
              "image/png"
            );
          };

        image.onerror =
          () => {
            URL.revokeObjectURL(
              url
            );
            reject(
              new Error(
                "Image could not be loaded"
              )
            );
          };

        image.src =
          url;
      }
    );
