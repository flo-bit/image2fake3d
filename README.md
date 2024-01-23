# image2fake3d

[check out the demo](https://flo-bit.github.io/image2fake3d)

[![demo gif](video.webp)](https://flo-bit.github.io/image2fake3d)

## how it works

using an image and a depth map, this tool creates a fake 3d effect by moving parts of the plane where the image is shown according to the depth map (so that the foreground is closer to the viewer than the background). 

## Credit

The on device image to depth estimation is based on [RGB-Depthify](https://github.com/jankais3r/RGB-Depthify), which is based on [mobilePydnet](https://github.com/FilippoAleotti/mobilePydnet). Code for both of these is licensed under the APACHE version 2.0 license, so the same goes for that part of this code (`Convert.svelte` and `model.ts` in `/src/lib/`). Weights for the network can be used for research purposes only.

The rest of the code is licensed under the MIT license.