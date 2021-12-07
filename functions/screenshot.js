const { builder } = require("@netlify/functions");
const chromium = require("chrome-aws-lambda");

function isFullUrl(url) {
  try {
    new URL(url);
    return true;
  } catch(e) {
    // invalid url OR local path
    return false;
  }
}

async function screenshot(url, format, viewportSize, dpr = 1, withJs = true) {
  const browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    defaultViewport: {
      width: viewportSize[0],
      height: viewportSize[1],
      deviceScaleFactor: parseFloat(dpr),
    },
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  if(!withJs) {
    page.setJavaScriptEnabled(false);
  }

  // Hack: for specific Emoji for Your Year on Netlify project
  await page.addStyleTag({
    content: `@font-face {
  font-family: yyo-NetlifyApiScreenshotColorEmoji;
  src: url("data:font/woff2;charset=utf-8;base64,d09GMgABAAAAADngAA0AAAAAQEwAADmTAAIItAAAAAAAAAAAAAAAAAAAAAAAAAAAIPdAIWwcIAZgAIEpATYCJAMUBCAFgi4HIBckGBQbaD8RVcT9KNDHYmyrhv2CDUOZhhaIm9IAnHN59bDAh1WLj3xbeMQDsOAj+8FPeHpP1IMf3whw1y1rWSIFlEQBNU9bxo/wb/CQ/7VW2nc8cxACRWgkgfPze/tqerbnCH7XbJAPAIyJUDFm54AcsAuQi5AkvDoXSQqFU5ErVComQ1ePdIAzYlgB3bTvLx+AAgAERACsIgAAtKtINRVZHCwKLAAAgCMvJ60BAAAiBg4AoshtR4IzODMGhKgpacnIwpXeVgRe5rhe5nn/L/MjznWGogtda+6bAPGwE5W3zY9Po/R3jYBMItdRKb/tyUJ6ftuSgFPrMtL/dRFLOmSJar1Ms79tiCVl42/odZrlaej9QyfOfTPq27HK43UCCAAAsHloqGgCwFA1xFQXAtx1iTDlQsTDA7qyUxFb4FrE1DEMXjJlCgrYqt26RPAfZbbCcyotAQDUS3lpmJYP0nnWSVpFJ4HsmO5SGTT7iDtu+yvi4aV22ejrrLKUuVLOzH+qxZJHhqJRhnaf6/g50JXBtPQrzStuI8jqvc+JR7cyKbd8YKoSCxIHj7SSX7eCSTnSH7nYYZAuOcvBN0EL6Ww5U6uKlJvhCvyRgMQMDWranjagg37Wp6LLyQr8E25Z6fIWWR1XWr25Vj66D946sUAH/YWc8Qxt+t4MnYIUWbnpX2luKI7YKW7h0ttULM3dn2RZvOUEIL2PSMYs8Qkx8tJu32zFNicupKQBeMqaIG/D69gQlmq9rp9sJcFVHyvTuYo8f9Moa0cutEtUTrIy1s1VsEcSzKnrJGpn96ucQhd4WK0WCPBdPxTa636rjvikuA9Qn3nxDR0QpMVPAxanzoSyjVLKWdIWiyGjNLyN6nOjrPUeWkbL4VAen4TLomtnS0QCBzUDzEzYo/v1NfTJ85OEpgDo9PUHYvWLXgIYiiGzo93G5H/9OpIZzKcdnWJh87+3pM2lNRYThPQpCMzwRtZdRRp+6/juYMvTrLcBI4cZLeTqMxNTByQpwr7Q6gnrf1Dsn7Z+N7LelIV/M5nGDvnaFZQQ4egeCrllAzJWMZx8JpGeS6r7gbPVe70mddY4Gh2WJx/FsC8q9RhpacSWmDDyb8lvW78+S0gsYt8mq2hfnQOzbqE77qMZMeFTjzqAF4NVdmGM9rfT9k8YxUUmGXGPZZ1wQbInHXtcB1vnAO5/XdXOP3wrbOtsJL8nrN4PMLzP444Z6D9OiD5shp9AXETWiILszCGLn4b8R0tkfn4BRo+IoHB6+di5RxneovsEMvtf1BqUSbtq0l9JghlNXnxzcq/sbtrzd36Qvu8Pwd3hNiwDLYYsvhCJ1GH8/T3GodSbS/jiLkDXZyP42Y3ZFnDkBLNdcgnp5FjaLXG2xP/VEi2Ir94145Uz0s4ye3xGGxK84pqdDPsKtwNRISFNi43//GDX+CtJEr+SMWT2/s3Oee+frj2wGBauEp8g2IYbjx+SnDTM2Fg3Qu+jJg3fXaHEZHPtkLm2BUcatr/TVU+wimHp6/XvVn8GqMN0GoBoPU0PurDvkSMLb+z02Wni+yDaITl9HiqfsL7SkuuyjoMxF8ZovreMR1Vi1NV+Xe69WVuzShr2kfunoAiqVbbXUiw7PYgYrV2luYgQkXEeE913+5FjqYc1jueOr5uNX7dYIqs8dEX1lmaYHuqLVh3QkofFrnL+ZOnIMm01Sfduxgi9CFYjVHNOw6Std0TL8diXPsm9P2WdDZk99GPqarhenovaHjBY6lK38bAxJiT4r2cJoH58cFnKsqpbqikZf56PKOurW/999TGVOTiMaVhly18J4zlx6t9/Ah/cGfbvk5/9pxzOVScoc6UvFUSL/nXMk5BDpZN3e6QGJgnwub8H+N6RffwtDUZ+j+3P08rFhCgVTh4Ofvn5SMsT9VRp9XbFdDfk+TVCN+l1x8nuIdEVSZ0sWY5pX4Qe2RXk0QcbFmU/RqKDChJdgcjPh+gjpE+NIMdIzHszkuaslDeA3OrU75pUv4BDl2t4/YXXXn1s+0g16vUK2RM4nwvwuIJss8dxjmjd1elnQ2wpQbcJZ83jnvboM6DDsIZuDF2YNOhWZdltzMIq1b59tDfNoAAdRFiA8sNgJ09bRUWXGacLCdmFKHHJpM6k3ee64REv3zc+Hymeyw8AAADkZVSkayRNg774zxsdmJYcIDQofHBrLxDZhNB83xVTf9VE5H5DlMciRpoREeYIW8FM4qd3sovoLEfMDyKMmBFb8wg3GURDFiIZjri7nk212P0qf2XH21/msx6qISVNY+ZPzPTvyKPZquWetImG0OP52oG3RwuLGs3+iZVZyckGUB53PzAsF8g6oG0KcRmvtoXAGfIQcwsq7ZeyjUIg2hH/z+gPVcBbAADqbWfwRbU52W9TIkBE01yTrDYZ7nbN9KNO9Cyz7cHb5U0VT6nqey5nm28mNi8S3CFWm3xj9WJPRlFVRBqb20YMB/F/bEYQjIT1QRH6Uadz+8WoJCw379p2SsNw/uY51KcQCFTK+Hm5R2EBJ6TKdVgW7IC+1j+GjvVfVSX4QGDVaI0kbr9X0151Fbs0Q2QzqKQD7bYeRBYzP0aOgglYdoHx+QyHmRP7mD1kmF6m5TPUjmsYqtbUZaeYT47tAK5S+ufbW+hPPue1bRdjS7vryzzUzjaPRMI7CI1h8zr6dVj5F8uCIqKF2N895jF6ldrS/s2NORKMPrgI9oOP+fgud8gr/N26m/sbyE0SIXGasrFQ15JHE0eBT0GvZEp4zHT1jaCmkJHxR8O6sOSPCeXtDUE8kMybeD5VGDZNV6iSRjGmInounTtAiSM3eDMnJ2wg9sWsnaOx2j4YVbCvl84KVdVx43GoNvehtZb5/9rl34Sibosv2USbulYxvrr5x+GuxxlLqC5Es3xskC5NPY9bPByaeX082CDzML4HyBx9/jXIEB9V9Gr09B2BaB+Lado+xuROgnXACgNxtoUuHl1yhKjPXWSQcnjwL+vI13ZtDgbnrORV7evJWZlHHeHuTxbwBR/BzR917EZaHOdB7v2KwlL9cY87aF8K2PW5L4X5M/qyfjOS76EhjaRbh60zB5WE28f6lg/2vhetMuRfNJCmHUDXwMb9zs3bbud382f3wIEJ/zSBBwXWnHf/ffpSodraJIxBL8GnbVL6UL3v/VpZ1zhFp/jSoX88pI/qwBmZJGN68dB9KjvvFfKh9AHjoWTLLGLOBpU8HVbVl48vVP+IkmiGrk7GfYlHZxqIRG8E0v8uA/JbGCdb6PlRe/ttBJsgj559Flk0SBsXPzZM0NwkIU7ox01XLK2OgKDcl9oe4sDijzfBZItjVsEfSrod7scvEkmTDmNhmd0froeN+XEsrm+Cpqs7SPZxjWkqGwWd3hWWgWUkR3pOdZMJPi+rOV/9XXDY7B5G2ivRRjn0N5JYwrtG+c8sU4uSibnBOf/3djfnrWieJX6mura7/JupGHAesIW37JwesOg+FCGIV5ITeF3E1Ikw8M4F2378/aIjQ8CJueVzLKbBaLZybcDwUsE29YU78yFP75QuMik86Ur1Wju3n7h5T/5R2BzL924yvvrgSOi2/H7m59CXw1bite9iQcXv09i+ijroMhDUaPVaE15DVFsPRtD1cJbKxix/1nfShTEnnV8QTHp+SM7RUEeZupfASYteu2dJj7rxhSj9Z5vb55NhtMQx0NZYn5MYgKKAOWvzy8rkYgiJiFf0MnTJbNFS8qHGsPRgf4PhowDQUgOTwPwB/077rC1A6L1X8uYE0f18hP9MLi47MuUe7m2CBAtkQZFr7PttaGIwxqrtGYNhUnnrAKYfrN+Q+CbGFe4HmW3PZLwXIL/Kvs76sxR/FLmLSzv//h80VjIR6mha1wIi355eSQDGCbyvD+gzfPSvnAxndrKkPBYd4aJ5RsqeKK1nkt8iLKxKdC3bd+c8x4qsYtlVQ2RWN4OEzSMSpO60JIOePJ7XSjIUC0wMhnJbRKAJh6J08Owkt/ylS9t/4W/34q2o00XOJq/Pd2sEZXwP3rUu4k/W0UiOtNU3zU7qlJ+m/zjfJHvGisBNK1g6FSuwSrKy/AVe+rl3OsGTHcJ5Y3KkdfNbP6k3iDZKZ/+hkYgkd1Aj2ilX+L+X7L6O7DiTfDOUasGLcgZOufaN6qKM/CiO5n87hX6TMmZEOROimSYiaWZvwwyIFXPERhDishIxZouogSAa6IqmmJZDHP64zYAgKpgR1z308PU/4vmyYiji3yKiRWY1gz/MUI1aF3lKFQVY5brKJMt64vNvFfRjCwM4H7oVYQK4aueH8IwtEMJUToGmRFne75SGSlwyOGTLFXF1JyhvBNuAuZN2RgAAY6Mz+bHkWfqOX6EYKFS9DqsCGPGJobUJrSmlwusSsdqJikvbr6V1/uAwVWtEQ/MscjRuGXTt/1z63Z4vayINs+57M+J7UNrT7Ik+haexUtt/CdidMR8QK27l2SnqrbtVg/Pf1RLXWdyBblS2Oi3V2KUpNuv3LU/xKZrPxD65oomR6IdzY7Ns3J9qFPJvlJj6g1pVaxSmghg1ofPMcNlQ2BSbwtaotCFi/V1B+a421wghf9Z774qJUunmOe6sVL+EE93hI7Pt77Kxl7Z05EdtJIR6criCynPOuC64VoLvDOhfgmt8xOigQExF/F05FqyoS55goBGFYZ/xUJC19U/cn9rmgAEuHVx/Cupzm02Er1FXxxyvjDqliDbp16FI5o0rfEvt+a4Ini91k3wOMxEgl/EDZaEBr4fBoiBoPyvfyLIE89wsF7v2xiZaXEYxfgFfAdLQ9sDyt29uMRSg/EeAfBPeBV7tQYCkwonHmc3C4+tzK/auVoNooWFd8cIZBkFkMMg3hnH8W/Tp/WklrrQ48kdo6UJ0Wh8beDeEh6HuOPjPo3KeYLDSkFg/8oeYx+9jTKdus4BP0qFJaj6Em5i78aXFvGaFH1squUvjLXWISMGww4U3axDJ9e5nIfXihRyxX0dgo55EjvOJQeNDCOC64efeqU4CftbdMaQHiUHaJMkaX7G1dwWuW0AlPOzjxjlMBnb99z4eo8+WZq6ekd1JS2rSDHhdKA1wvURyZQTAqlWXbY5kR4nsO0YmA0O4x2wOWDnlsRMk7sGR2olZwfngkwKxmUdvX3lrG3D+R4okXF8FugDHU1hhHpR5ruTmvXoSL0goeBc2djYjj7b/Qg1KyhFKWn28EQaO2mg17mwKEZl1kPdfYyX8YgOm9MriAJtNC758Md8MobT0+CwDSBIX4VfoyXoHZjrY+5IJ6G8lhwAiUGxqANyJ+J4mPzM+XqCSo4Rk1ShhP6NExNasML+cxoILcCGFhu5SpIsZF+NSSMTwmnLU+i7qkH2w4d/geCEJ48Y1OTYcPltYSzvlvgGy3lKwEH2AXB925i2LamM0FI9BjyXtYDLGqApJ6XOw7pfel7O5gWsftXdBYvzY2n27lvWpHbkDosOw7GYDKNcUcszp7TE+P50ajU2TgjkQ5GD0TjLlvxLerEoiaGzxfHJjN+GsnGrqMCk8J/XkVgQ0zlv7DIV3p/eoCjolsB0tFAhY6RiM2m4YIe3yJpysKC0XjQoU8mNE933CJcE7XVbHkGePkBoECJcJD3xb7ILXIWGKTx4kx4vDIavW35Gk7SgM7/cnzNFw1x04kiCvlaW/j594qkUx913YI94lhFpK/JYWD1cIEn/QxW2yY6heCvKhhPSoyQj/McfonDfpkxptCmhWDClqZetcyvXNpk/ILEk1XzQ8DHieFf/QxG3kK8c4kCCrv+QJJrQkNtj6wmBC7/hTx4va96Ola3O6Jre81w/Y7qiQlLSKhrDpWEDDQoV4QnT9Di3+pmNx46KyDw3ThAarrM/Yu4+oaDLyuvQPCi7/SOcUtGzav2Q7qTBj1Gx+rlxqkqaf03zpbu+Bf50r1UbZxbQ5lE3EXXbroKASZhlaz8J/2SamnQkus1g4Ik4dQzJwVldkxfoR/+cCn8BIn15Zyy43jplTttlqvcqs60bALIq760PHDF+sPqhEmlW29Hr43aNuCoT5+dAgT6eQJcIwLte1VmmEOpeAlNepFi/ybpJUU1tlqMppvda6GbJjgNnj+xNHvui3UrFKyXVCWE4SZHjiiWTzlQyfdI6KEi8N5e+7JDwJ3iNtn9uH8AgQ9sJNX+c16spAawo8Sd6YQFkuyd3C9HPzEzZuQgi5/GJfbaigaAdvPTfukc8ySYtvdqHna+J9yX0Yczj25zs2XNsA16DFp9vYjN+Ld+PDP0QE+yve2O53lHOXu1cuZgQj65ED+pIr+HxIpMcmYUA0+W59mzaJLLu47avSG5ZlX2Pu5wEGOFpK/PLKN9Y1dWxcM8XWHbCezOrhT+6ejS8B6Jtsdr5+VQdJ+eD+h47dADvy6Nc5FZraVhqNuSAf3SN0OZ6UpvWeRKFy/PfWx+qZrniqSWGAyGMsl4d827YPipL9JGhxr05KrxCQBwdpjyJNZAjjpWgKhM5VWrGY3dCd8MgO7PTuRd3eIq+4/q2T6U4pmi5rrBBitGe244Vfi7sbTNhRJt3aTTO37LcJd3oYX1xnDq1+7fI654GZkQH7uHBpLjjRkB9C04ylZ/V+4jXjAVWVXk4jGCu2VFO0eeKEiHQLMXPVqbEa6X5uEzYa9nMMdcNkN4Kh5gfcntxt0HwmnI6+IJ/5OUVeMIzLkkSl35xbP0KCMs9+y2/FUmyfKVg34BCHrnMp4gZQjBERjr2LNkpRxPE2gX9ACHpChI6aoav5BnQrNEtH3WxRA48GMfgYIGCOY+Z6ZGZ5OYIjSi2UoLQQS9cRyQZJtSo5OaofGqgGg8UTSgcnbN0llLtEKG4XT9IzKlzc5lD9qSG+j10a4VQ/9G+qPtXoDIgOXSaj0NHyQ//zyO/M3p6+p1p3Q0iYdoLYa6ulx5YW31Ujgh1/b0XRcnKH0I4124Ibuv1HGJAg+UtxtNgFYeOCP/5tBVNOnh99f6fnKLMVGEGCwI08haWhJpxrlFabDwuaA6XIJLEzXL6tvsajUnojG0kIVXGT3ISvNp0vxlkOElGVu9j3t4mU/tJNIlWooci6gnDHsrBQjBxWEWl+nfB+P5U3Ljw4R0qioD1aXSmIDgmgYCjmUyM9+2A2Tsws818I+Wng+/4Y+Rl1kg1TitJI69DQ8PF6/4k639LpRagsxi8Uhy7r0xxIUe3Cybd1yJRDrxPeV48NL5Wb1472WUoyQh3P86ittKtyr02e4+9iXBNnHYf1gpNyDYdlI7J+HY95GgfU9BM4DIM4dDM4jGvUNLXYFKjST0W6ykmCRkd0dGMN5ekA1oarYiNwbSHg0ClEV4CanXgqzxSM2KqFc12uxcdDL0F5BVW7mk1rwQi4E+tkyVK3DRHNAabJbREBl/Z0rhwDBbgqR11TYYiuNMVHQ0Cnrg/LZgAA9A+rac9tAePHTzCo+3omssRJ/jIIpNmJYBKL2KPMGvF3rH27/H1DJ4FWD7Z34O/uFTXOugWZx/Dr1k7xwkzGjjdod//37dnyUaiW8D5monfM7Ik/H/5sHXBrCptyboXzTtXViO4KjH37txKjTsrSJWTWMdWD/ZK749ddcu7G22rf/h5bIn1mXHjIv78dmhd071H/KD0eQx6d+umzxuGxwtjYsQcPSXq8kEoDpsk3LHQjEjDMpEfV8RdhOprZZs7MGICo1Q2up59t+lT/7RL98Gsai0Fc2QiFofDNWc8uqtX/g8P/D0qLFoPYX6iM8eqEYKep/e0HtngUgyWq3lp/r2iHBzAzI/ca9Wqsa78+FAb34i3mO+Aps4RxrCidbQ84X9kPEgmF1mAJMZAyRcRrXv7tEfN/8aramCyvvtf2ZGn1uJeoYhBYNHtrDL5nwA/vVVWg6aKWpOp6hxp9iQwjDCU74D2e9T8Yw+f+DJONNeTAq8MclJYxlAS9q7HwKf57ssLO7mYu4KXlFoOhRxDKXORBB37hg047ulXQkwkPBt//0CQPhqya/JyTkxxu6VU82fz+00dgB5CU7ULbk2+pICf5XTcOggnW+am6RsABMo2EA65yInoiQsBWKrUuEGz1RtZDbChouwNM+eq3EyEH1PDBYOxJnaVw+zgzqLZNLzfyIi2kS0eJH5l0+UXBwmigUlIK1Q6Sms2acmWKIcSSmLAukPOLQzmRBLcGDOHuhXlL+vTJCnCok1UW8oIkdd3GYEyg+AJ61kjJKqznpRojL6apPldKRHhLW24DUVZbW7e499ID4uMF33+rBOMNObt8/+6H2YK85DBQf8eDH8cYUbXGusnXmfq+r2hskQH9hJBrqVeXN6UB9AxIR2t3yfdJ3L4Rntm9woySkn9I85vzfH1PZ/ETds1MGKkvmS7PNQ5mZgWBMQ7Hi/ZgViQ9LXZ16MQ7/dQQtkodbPD/HXClg/Np5T9aItz6MDboM9+QKWT4E2oEBzlVJOrK+s3qJr5Tm9O4r5MdCKumGRD40xD4ZBJ9FuX9dcDlegxVI+EukQGYK8bUjqgkTLWI/6bCnIkpEzIvmtDN3UNsiegOplwNZ0OFCgWjvrwjAM2fyOucSbUGgUGWO1dgW3zZQQFLfhAyJiUaEHeKVvtkGgSBMwP/9gfo5lZVGhuJoN4SXeacgMK1UYNISIJkIT2vCSmN2uhByEcRfQD5aEahUoLY5ZDuRC9wImhujQ1j9rDzXnw1JkwOtg1GjxSP8H0eHSXQSOIJU7omfzifpXdGCtL4G0rFE8znlW+kCBICc4d7lMVVQbcDICoRyRx8JPTSl5wwe1D4gIReKuQtvJYjI0WCTIoAq9cJqtHZjEFIbgF03zKzzTzySvP5WAApv1L1qybJuxOCFUJpwU7iXuDxYCiyLNnwdBAVEENaDqRZShEXbgSErHJsOopZVhMHxIQG3skPmqJo704XSUL3A0/s6B3uRwKxP3HqJ2R2J81IgfSh35Vo/28RNjl5mM2jhyDlQ8MSBISlBNxb2tsq7mXDTEkl9B65ymewJX/uviFESZw82NkaZUKP8+i4WLhD7jg8JqjGVDIdKSkOAvopZ7/7uVWt/kYbqSA4TGjIpsRx0ZrkZIM2xtD6Yqaf3hyOuMYNoLbc4Y7AFRW3rC+W2WneWb4snydZah7l/qWjQ9UkbtMhHA5tPzLcFPx4xEaBSnBr9KqlkkWc3pKUFP98xd4U3cV68byMI7G+PnrRThjvEt3G6QIL/jmDfRNA80XsfH8NrigGgSvdXIGyKXF6ySF/1/ADE7JYoUACIWaQmwEOEAJHlRK4lIlXLTw6svGN55zye0u+7FXRUUnoRpJTq3UxvhwqfBD8TrM6kmfllNuCkVGYTqsrYU6DL/Qti77ZWXDKmHMreadcCNNXXWKjLTSoe0coIcVYllpBwl6NGUgZA9MQ2KelgKBg4EMy0sFxbsyRhISocQRtj2u7nXEyJqvygl5gcqzmaIkh56ctJwUVCWGIZdAwZ8GWRQxyq5Dou/N0hWiN1eb7Rs6zYpl7rdD6na4ZKnrIfwwwvxwOj902vKRMp9r+XuIhii8FskwT1+mfL1phDsDzsX91DvgJe0YmB6bmphZXdg+P7/89PFP80/OL330jC+vbWzu7tYx0hAKKbnhAFRYQhSD4wAMOsIJh5+u0Zh3Ax/0Dx7zk/Iq6TLnitxCXU6CmLoUVAAB1sh98RWmfvUKFQNLKk3LTdMK7/13cPIxpg2QjrA9/vLxWftReQOoSf/1MbX5IISYB7GUG7u6fC8hToqqToXY+fNeG2KXVEpl9OXKiJFlbY2t62cb/8UQTlb8rXh2Ug6XWO/j1y/DjD6JJA/Y+yZOujVIFdyn2ECI6QekfOA+F61d++kdhja3ihYy4K42oKWdpahwxT4qUOVqoq58y1dqzpPTztbZmc60TCYTW6odtbVXX9pxcHWwtjkEJdTbQlqtXJyA5yv9iYkZVgc6BJNiCM8O0+vt3v6HJ/l/LifXsGFr3/kaH4La98/Ku2J0nDEhaXtU8zufVZ945VzmZRiraIK0PwW1OSqJF2fFib0lgWlD4gTvtZcvmoiYqo7K6qs8Ot8GcVxy5/2vZgv6ye2dFjthnVZzez4xZIIP1V5BQbX26gkea8g19MI3SY//ojD2Fssu23vwxhMW5SaqbfAllFzsnsJsomjqREuUEE757V4OsLv1Av4OOPC8DIUY2m6Wki1TWfErUukhV7y9eq6Fw1pM1THFwTXBWdnzeYJdfJkS2X2K/TuTIElgq8sk6zExb5qu5pbiZ2/gojLZJ8jh8dUK559dG5njd15j1y/vTjJHByQZXoMilsh8z46AdUZTZh770y17Kfr7YJJvewZrlqzekzfDTTcgy+VzGFKfY/1yivhA0lw8CX6ti9lGPABjASKlBRcy+EG8BOnZ7V8+E7rPwQ7qxS+VwS7YuFyp8Q977hpPH3fVGbKPzguDzwL/JtJFp+L6I9KWtbv3tCv3WikZcsfnAXyRC9cAR/uDcJl+UQMMjh9bnYn6yT63mw/xMDRWNLEbjr7HtigQYuq9+i+lLUd7yYi9VBMq3uCMvuaUs1vc2m48FDmdzrX+ec725OD1DriuODCQTrE2J6Y5vvd82yHwQWCkHDnab3px6kiHaQJVADgGXrsSnjb7ZL454TUQDhAT6zc1LA/9ef3UaQRe6MBiNMxONIsTmn8PJPug7k4WYfZ8e+70eiGTqioxARDosPRXEGcGNGb38kz9kEkF2qI/3TMmxAs+J++E7QQkh2PfckzDpe5bEhNrxlm3qIRtoI+bT18kAm/mj+YIEv5LBoD/0m5sdJoUJxGpSZFgsyA5rIE/a0/e0bchVUrQEp0+IoIR2By5Msz9vsa9tCXhCfN2PVDNl/hRdVa9H77wz/zCGzBNGLppLyDqHh/GJTdePdsDzhZ103KVo812jZYBGfnUjEXuKLnZY9Qez9O9Bq7TV9KrLAczuBvXLAJ5Pq79nQ7ixeDwbyOnro2auLNO1PZSlf+nJ8Ex1epo9PbQ9N2To7Yv89C0RUn8md+VQ+cMBqHINQl6c9d/7bsdj2pPx/rN7d+EwZpjy9bCesKcJdmJy+NV42METqJNk8P43aNI+8ornA5k9ZglqR1OaqUxsfA7oic2OjJjfkXRgJZrC2OjphvLgs7vnQe9DsN+8ZUXNHQ9n8UvRlKLVZmbSi90SLhsgAgkMJHhE70Too8ghYQRv8FxYk90G+M6RfwnEpBRCC8gKEY5L+RArTJraliqcX65IDcXCXlMDR8v6e5156Jzt39YuNQf/+Y7kWosCgr1TFomZD2zC5Q+74u+fQco30eZP6Ilk3Bl6tMCJKP2qPm7XNLfBI0A/SW0CGKebwRQWgCMAfmhJyYUJwmEDO6mm8gAjAlVXcgaSUIUupGFKyVs5YyzfAPAZt35GzkVMgXRB0A+ml4gFhPPg4p5aSF5hV3qUzvE3dL4yAAA14h9Z3pXlcLefXEShZsWzHEma2ZK6/GcP3weaBvdjwDh69U0DCD5VhBtS6i93hCQp6Vn88c3fv8+HU3Bo0gaSvBcGZIUqwdLbMnUd+VD4Fhiu1gwDEgzcnmgUJpMa9tmEFaPqn+khnlLzOk8M/C2ZXwiE/uhWo04xBe45N51yNBQxusV9SXoJH8rqkKoaRM3RQB7qU9mlXCfnkduGJ/G3BFomdu/4FRp96DpiHjk/kEnv925XAntnr5Z13fJII4ef+vLLgzo+CQVB4GdtWXEhZdHwEDlrXAJ3OeIdYGK7MlW/TXxJPBxVcRseqRUHx6R8udil/KMdpvhthk+oqIIe3JOUybhD+C1Ngeqxwjhc8QvG7u6FCry8URhu1YH5o5s7FTQzWcCubgBJQRVKcMe+kB0jUOylWk2oVGXD9LaV5/g7q9BLFTZorDmuVldndTUZUkJEifCvRXsw81Sw5P9IGRzBw+npNhu0kuBDV51IIpjVyfKSlGTAOLt5rREIDBcbNSmNIRlVuPEeD9VHyA5Ci8svLLfVEq4J+cEGxyb5/E4sO644ab2L3dNWKh34abbeFvNC3eUdVfAdbiyZPNWHwD55EqFff6Y+zTYIYVLWmChSRhnONe+HRlT4YF64K1IGv+47016hycohU4UlMPXEEdLrnXUHw7zfGsxckwAY1Nh+13nK5CyY8O1omPem91xdWdQQILxAb+qaE7PV1/BMjQ+PfkfX0AKiSJX0EULQXm3bMc6tKxkxxGlXFgffXhGS89XCCLLIvAKTUwXAHbszKO+CPENav+BCUcF6lAHr+GBhmTBXvM2k3QpDhw9/q7o5AXjxTbq92qrdQr/BGkMbrepUkcWoB9e2wbQrlUhHs+Eq6p8sBvsYRfTWNYFQkAleZVOJ0esA+33tdVJ53zAgPDjif+l6vRAmJZlshJR/5Vdy+kCUPaA7czZQyJNNYxalkCQ+eM2s/bJ9O2a+Tkh+quJcA90N9wcEHzOwyFui2Y8rrZcqDB7HCMVN3BbZ0pTTiZdfZ5OeV6823Ntfo9rlCvkcotk3qyXYyLW3Je3q08SuqLWAKtI4sKOdsHCYOhDujY72X/N8oKPjN4tuResBbjaRccj2ZAHDPZte7YT5EBhzJEdqJyq5yP62zw0rPOe6SrSThM3otDacrsuV2a3LL+1XocO3V+P5de7h/34G9UUpni8n0I/ZtjvT1pfTa0HF1WdmsMUX0r2jOCNxReOmi6wpxsJ9jPCkZQzlkTh1ba8N68+KHJUpPKYgyuCj/DSqJvP1KKGvu79y6e/4QN81/6/vVCy7VnZ5yQkZntfJ3vQEfl56jtuTyP72Tb+/3KS3rlZkxiDIyeaXGk5un+OKa2XmiVjKqz2TLo3BbKfor60vf6elBuIMN1y8PHOabtZy6myYKrJN9qpD+qxWyllbV74J6W7tfMzGlqrb+5p91rYnDcJGw4V+GgrLaawoHiGTi5NYDcr5M+kewxTKhitIJJTgblk2dg5dEOhC8S44wzUE3YpypYzjat1LN478hVoNvOVO/kcPCTJHPRsKz/0Pk+NdykFiq1I8Mpsys+1rJU5tpk9txHNzopO2KZdvlFNtF6dPJA6Wisz83jXFud64sL6LZ630cjyVTQHOOymBW0n+nN+9Qy6Opg4eScamTtbOf2rrBpmZB1lYLiT4FKZRV9+4Z/K5NzY+o2960sd7lovVElQlP7fGzLwVYZ6SL0F30kIdDHTlqpo7QpzFJWW1NDSl9i4Z6emVwqL/XG06GOt4xgEKUfRmqSMOYnquGg5e4yb/SeWd2jVfzxz80y7+69V582P+0aDmUrn4rHbuVjbnJGT4/kPiUcXWS/7Kk0jGSd/m/V9GyzaRtOPBlA6EwzO9YyfbS4YVQFv2Ga+ICR6sDUJcbhVBp/SniLsQiFVEG0Lk0qcrG+QQcJmH6DqoNfiIwKCpXzLdGMkeSf1HYdcWjQYPMBVuktcBAFD/bTH8r6VZtPo+LmzUaWXL8LHY860XmrvPPGmuf0T/ZDCFxph88xXVVi5Sk8ZfWPjRfTszD19tlPN0K1jCv5ttCzeVy099V2TiF1eHmdGbtkw6JoiUun1SlZnedEauseWIFmMDLe5cywtcMQwo/ZmZssKB5OE7cQaYR1umDnR+1636iaEbzYf1pNNiSLMhGm+xOo7GMtcJ+QNSezNHwPqf+/zYADEyQh/WVCWWbRfxsWXmqWJueB5TGeAO85h/HrOM5xgVDAg+kjTDUhyzUKRaRI576UERQalGh1/lq5qSqOUgP4yqV4OGxkHUbGcbW0iHlGe84IvkgM/UqHbjB/zbnKYHqo2zOQGZMBzcB/Y/3uRKkK56n1TZp6Oc9lnKMBj4NU2q6POOwnr04oPEkv1vutnTdpwtPGwFsYzJ7EPbLFh08Zw9Ulc6zIHI+sodyVEF5QNOd21z261wSVg+wOmuFvSRAA1Qd4UZIE30CSviS3dRe57y5D7I/1MBVhK+B/owJ9IuUZ8Kk4nV7sFUrBCIdT6wGNkcaR8LyH+VaulPJ3fQvPC3u+T+e1Qcv6kKSh1yxFS7/EHTwH+TrKdMB83vzkuVEvLu6BF83dNvGgmDnl/vzvNUr6lwlKjVosRDUXZhZ3VYpoAO3N7kd7C/JY0d63NrbgkWHMjiAfooobj1baCi45x+3YqcWpwc1Bh0DUAoYNuhlR/YZEgKsZzNrPuEfI4WIB7wR2ViAbaZr/rvDPmzMxlw79GOGnPs3oJPQO9wE0Gdo9HpCinV47TVuRd7jX41wCKRCyQaLpeaLIZ2Yn39hLX/Kp2bWFn5YjGhTbq/c3198iR360aPduP3IgPcv7//SRTh15GIVOC7RqABfoZb/A4O2MSNdu38HNJNj3dTXfETYLkd3mhISEvOD46jI9RwiCWzxxmWc2A7EqVHleawrGJSB/AsUI8tUHHTAfESLxORWRKQhQH9vyLpTcMajHfE49lpA5WJZEO30dLDy5uApOG3X5E5J3Zt9mFh+lPs78ZQxmS4oyzQgTIcRYu8VVSrSHKfATzj4brNvwSIdWuIb4UkoZZQLnXKnT3/zARkFtAQI/l9/WctKZI+dtpcZZ60BmPuaLrbYvLx6lj6uhWRbnR2C0IaHoFrjJWTWBH6jrmxj9gRKGPFFrAePJS3vHO5QCK5QEpnldfijMn2phF4Z6S6RxOr74n9n71O9Bcc/7No3zO6EmW0tOjeJuSEcjweCX4F9BAyhUHeQktoCl1EEpI62mxQu6ZCty8O9/ELyMYvmXjwGhg4ZDIseh/X6e+iJ9uzaim0Je1kdP/wNjstXgvas7F4+xTq4/vg8K+5Fqb1pwtVTsYMm46UZ0GxikpGeUcMGVTKFECGZZFZtpqA8sUeGKRXBwgZet5oU8RPIHWb/gEYPmAQRoUu9oNuY6bFgD6f9qECAWf33ya8gzHFKqJkUVYMnQUQIek05zMDxCFcoIAdy+LEe3pvS5/p/t3F7zh/2l68Y/+78OR8J6N7tpe0/lUPAsmU4SYeYe10M0haAYG8ocPb5cCe7TjLXAKSCinDqM+9Krl0cJ75cFN866SQqiIITVJKWcIt/eCtw/vd1g9PoFwIv/Jc+AxfLOTJHPhpIabiEh+T9GTOPBSDvmdwnDJKWgvjAxcp4YJFLuv4TuRzC2+1rrUiGQ5cJIcy7ctu0Rncnbd/O19snxxkyulNcHIsijIsS9DNCjJP8X6oY6WfFWBOkmvWz0+XD6GrZ5MawU035HmWpVmKGOhNfoF7nzV1yRNTnXN7qwlhzXr7OrJtH1iSXTl0govDNS4zoqq9y1wbHF3T6Tm2tusUdHpYVCEKLQsI+lrcmFDfW9s/mTmNjJah+s3Thp2LhXC3/OGljrbOgdS4eGqDmqY0D1UtH+zWxJumWb0zLaOz5YwMpVUSSpvyYn8gfnpW6c+OkRpGppX1jR12ys1i31i3M+2y2gavyGQb36DwpHR9MwcJLRMjZ+82Ne0qTzG36KdTWqm8vY+XvGoeO5u8kU1AyW85v2gpr3B514BoQRGNwKRAUQnjqMycprZpxV9+Nnjk1sTZObPcXQqvbJMGXKoo+YSPsnF7HuIVKg1CE/zpLQ3yCMZllQyxcfWycvxmZv3FxJwtJZPPAEkzNrNPL4XZesEcvyR7+SdGpoaGhnp+i4qpbBkXESWWMnOW/LCkbFlCxxwSQVxMYGRTeb7Pcsb/mD+umzztfeluSXs+SX25arwey3pY0Xw5Kyo10XC4Wtz9qlVHw42i73+XikI59lsR2tqlocASAPzGbcAp1AJSukA2ywhEAOIS1DXYFnk7EYg88OUkXdB4e66pLSgoB6HGs6XzsLZ2CgHvw7dPGSDik9Rwqbg8wA7K5BB86hbCLCGUfjNTXbOa0LwUUDt1uQy6KC2DF7XojJdlrKbybCEoHp0aMLWIgL3qurSdml9bzwYAMD+vH3xOWELzOuUCoamFki8wuma0uHGrWVtfvAneOE01M3KxrjwvtwV5b4qdUja4bL2JBZoyE8VJ9xaYpvznmNEVyrUleBZXDlkHafDcv2/tJmLOuT4SWTH8F2wVQgjO44RkEvmS3kp5l2d9hXIlwVM+hBWzyOMddYxjfC3WkPBfmsrax8BOUJULzsbzVeUWE9NgTf0UHi5B1MeKgt1oGOZ+OGOLGVseH8RtScM88hWYRMXZMphKGNs4VNaoxI8De1XgybUqYv7CElpCVo/b7TTeFpkklWjBc9FPxlXk9uJwqJngiJlgkZOZa9c2CjAsdqoQ6xPLYg9UX7RzNh4fFoFTStNKjfM2aI3iZP1nSC6TAtYBPBM+95TfyNBQ6Lm1klGfllno6epoeW5X2ityO+mEVus7VAZzhCxl4MJJDCycvqJ06dWDQFYU3QqVkhET9zwl+5eZhVBHXnGvbbY2nbgm/mTlGTf7+A92LxincVKGLOpAoVmeeCszUWMDDKaKBlNacuVbEBfeL6/2BDXhg/zPQ2KT674BwV9da1qVkhxasSfvuifqPrCRYuqrz1nBSxyc4yx20uXV0FtqxrY/oC/+QxMqpfFeKi6Zkpn8yWr4+a703W/+o+VqrEZJDmKPp9cVSdynFscokg/9GjDGvy5xvMMzApp8UmwLp7e5VPw2W5N1i3Adf2UjjB9Yzsuy6S3rbA6CjpnWacPqGwNTxa5u/jZttdrlkNJX962a/4RLecVBd/jCuPsOqz5/kp1V15k/o4lhk9xcm4Sa7fLFuxyUGUu951GQCrglF4th65cCFQ272vj7ffP19d1wSw5I7Y33muhtc4IA91h5V4TDeJoLeHiTNWuMcKVmcIfMWP/YmlDUfDVjew1u3rtnMnDIya10NL5++FW2lfVk3RgVQkzgD7uybXvVFP9dnBC20dPil6tUJsqMpTPMRJVJavHR/CFCYqjmywD+IZ2VALXjR98Jc7Sl0tEtmgoM/sMwlO59pfbRCYNmTVcEjSwe67BweBjfYuXtNVicnpd3LJddTGfkIYKUQmrdlCUSQziD8uXc0C5Wr+njl7xgDE90GNqPlUundzIQTs2DOL74tocgxMO/XxikrsCiUCk3ibNraOKA1NHX7OQWDFctIlot/M+fGIdNGM4Njz1IoCH+IIMYaRCoUG1V83fyThBQzMPAnZhu0tV2XIQJRruCjpf7yWtmLGiY4Z+/JPSGGHOZkYT4Rzac4CFY053rRje9918buD6rmqQTBrXL4GEsqckW8I3KEqIy2Ybs8oMh/8pONiSREnlaCEuIlVm8g2OrJo9jgeczjcM74kMPepu6KOYGIyI7i/BYLGXqL86A3QruurwjdXYyTSijUglPhFY2MA4Ac6eXrIQUJ1UWac8WbDPfTlIqQhmPdbW0l7L3FQlcF7hpvUyq2nvMFe5havgJdX5anFXig7iEngVrzAoEsYdV6b1Bf0e5qUA+0IIwIqHU62zkIkjmhKxmvuu3LIGyJ2vxCgf7eFhgmUv3wkUBpNVxzS2lR4PVp4rnNFAyQEvhbyDKdcynlH7QRHcKSeadrhy1Oew4pJXdMMmf2ycdl1WsSl2LB0/MUpCCD8MW/TCRLf75WaR1I0xaLSlIV5w6666s6ZM6AuJBtxbWQ3uRda3726eGHC8ie1t2/vwaZqjSl24aCEQJJhX/zh498FNhKjht5ePrH9Bpqlz8Csq4hWoiZp2Pqa+tGa97gnTQXnR7b//0Ty1dsERihDDeLiYhTGuGMp3MP+Ld/tR+XvIRhZ9p7MlNShh6bM+3UPlx6u4QjLJ+fbRSVT8O2joCcceDXRHiiCW3Gwo7CXe3C8WrAOCirhJdae31DaxfbxvrEi+ZOr9/eS9eLj6WeP3nmx2SEsXcgrj1LIqS+xKF7fJo7lAwYRXl+s9OgvdprhK6Kf4l4gHVi1AplrtstbUbyXu5g2gcmZbwl2phvF+eiZ2DdFm9YmKpttFtUWIV6RgSLMWCIjBYLipe2DkeFY6flOHhtU8NPJ7fEuZQm9tzYGiv7ixM2YyKR846rabTcceVS099FSEkgh6d9DAKaycQg5QloF+vSmlFUZe3g5kV4lDaW9HwWFinr57Fso9K+6j7CSdO6KOJuiU88pILkWPrSwQnJtgN9+VlisKJY3tI2hjmUJTEi0HVThPSbcew+Rmx4KxGca3UoShLEZGs4HZiMRBoW6NUIPrmWS4xJt4zdK7wHpzbizxG1D6aeoGE8317izmeyVw4QNxzRsj3sa21rU0QixpHUhi66HRiYu4R8kxwbH3XPu2je/rWTDnbRWF/IHx+Pnfd3W2q21195vpoX7bVjYLiblLZ00pn0u+wz71NmxxEqazpbOA6Shk+6FFOLc3+8AvXh+wHDx9+cQnZl6g6Nl/jIPOwHrhK+Dd1cSEc6smDsacejeUMtDnNmYzNlu8zWQq8aJgqMVvdwT4tCkePhS9u9tdTMajuaDCLMBwxx6Cg4hIdG7/rG6/ylSBUD7EqesFe6tFv1bJOqVm5Onv7Vv2lKuMRavGJFxczXj5KOfS2f+SlD++8CsHi6tTY32/X/qV5VxJZpekEd793jhQt+hH0LDn0szZDLSUiSPcPutQFhZ0kLEwGj256/NjyOzsuybuN/Exj1zED6wlUxWHaWNm/tLP5k1yZy1ttkzV+VSUUBKBEb+BVAZiTToytXHz9Z2XG1U2QbsU6hX3Rt7iVeKqbd2Jkl+GtwhPH2MQhmXRR40lL5GwLib+GKHxQMzFNysDOSKs24QzeYWRhQ5MXICN72LEw+RPAbUlOIp6V++4jGV4/0U9FzBUFec9oXUuVy/ceYUoELNQ/K2RdeGdKTEAjDv1joiifCBd+d+8F977TOCUpTxLucEonxx/FuK5L/V8NiXHWkk4q2rSZd8B4/abFlO8HT6RolqseR3HACPsBOU6bGwteO/gsHlFtDtvGZ/K0fkVKAhhtfJ22vWDCM5+SnLEo0MIzaaANxoqYu3+U2hwmmznR7o24DGXXEIOWwg9KDrlcfISh6o1DueVR/StoNFlfqEZNQz5VFpqxKgQJfnATgw6Bd269bEUXLjUL09l8xtXF9/f+dx/T3LH6LTcGix6l3LSkV+mB86ZQGHqQn2KUntapTRkmx4RKvwmUAKPPeNOKRoPoh4+solqHP0r8rt4z3OtgBM/8QdSIsPjbADFQAMZDuiYJ5fGdrgKsbkRBV0jNS0AnJ7CkhVIeEEn4PmphIdoTLGwsi3hYVM2i+y3mZXF2I/pqeWQsACVqSNKflLQAwHqMQAAgWrmE+Q/pGcnV5kXLAECiDg9CWXICwZORAeiYAJ5QdqrKAqCFGYHAcHzDBjiUI909EpEiaDCAbAPQbhNBAWDNLAwXmkHXfsPLI27xFgrS7aArlgrv50hj5+XBy+4BAQCmSs6ZlLS0EY3LStHB+tLSXjw5BukOeo3cuEG6xwZBozcuzJEAGACkfwF0lnd1CmDj1lX2NsETuwcmIIAvT/TOO2AnYCOWgO7SG3b899Ai+kCWD1c+fCdfJEkCqSt7SHk9IIqk7LYipEbKi0FxkMEA6D+iMlTMt4iMMxIAvEjsQwbgArQGo+QPRsU+NIAO8+miAyj9IcUFnC83dmzY8tCuyoMLN96DJ1vqueSvd2TVVJ4zCxxUZs8DGlx7nSMXirMMJ3Pbnh0NbbbheUwyYx1WUrkTlWrn1tdz4GI+ootSvZCMiXJu8yI7q3a0yD3xeBaf+x5RTn1JMrTA7kPn2Z1zP1C7AC8QwUDq4dm+hPryggYbs9+RMBWm66t0lH4=") format("woff2");
  unicode-range: U+2728,U+1F344,U+1F3C6,U+1F3D7,U+1F440,U+1F50C,U+1F5D3,U+1F680;
}
.yyo-netlify-api-screenshot--emoji {
  font-family: yyo-NetlifyApiScreenshotColorEmoji;
}`
  });

  // TODO is there a way to bail at timeout and still show what’s rendered on the page?
  let response = await page.goto(url, {
    waitUntil: ["load", "networkidle0"],
    timeout: 8500
  });

  // let statusCode = response.status();
  // TODO handle 404/500 status codes better

  let options = {
    type: format,
    encoding: "base64"
  };

  if(format === "jpeg") {
    options.quality = 80;
  }

  let output = await page.screenshot(options);

  await browser.close();

  return output;
}

// Based on https://github.com/DavidWells/netlify-functions-workshop/blob/master/lessons-code-complete/use-cases/13-returning-dynamic-images/functions/return-image.js
async function handler(event, context) {
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/small/1:1/smaller/
  let pathSplit = event.path.split("/").filter(entry => !!entry);
  let [url, size, aspectratio, zoom] = pathSplit;
  let format = "jpeg"; // hardcoded for now
  let viewport = [];

  // Manage your own frequency by using a _ prefix and then a hash buster string after your URL
  // e.g. /https%3A%2F%2Fwww.11ty.dev%2F/_20210802/ and set this to today’s date when you deploy
  if(size && size.startsWith("_")) {
    size = undefined;
  }
  if(aspectratio && aspectratio.startsWith("_")) {
    aspectratio = undefined;
  }
  if(zoom && zoom.startsWith("_")) {
    zoom = undefined;
  }

  // Set Defaults
  format = format || "jpeg";
  aspectratio = aspectratio || "1:1";
  size = size || "small";
  zoom = zoom || "standard";

  let dpr;
  if(zoom === "bigger") {
    dpr = 1.4;
  } else if(zoom === "smaller") {
    dpr = 0.71428571;
  } else if(zoom === "standard") {
    dpr = 1;
  }

  if(size === "small") {
    if(aspectratio === "1:1") {
      viewport = [375, 375];
    } else if(aspectratio === "9:16") {
      viewport = [375, 667];
    }
  } else if(size === "medium") {
    if(aspectratio === "1:1") {
      viewport = [650, 650];
    } else if(aspectratio === "9:16") {
      viewport = [650, 1156];
    }
  } else if(size === "large") {
    // 0.5625 aspect ratio not supported on large
    if(aspectratio === "1:1") {
      viewport = [1024, 1024];
    }
  } else if(size === "opengraph") {
    // ignores aspectratio
    // always maintain a 1200×630 output image
    if(zoom === "bigger") { // dpr = 1.4
      viewport = [857, 450];
    } else if(zoom === "smaller") { // dpr = 0.714
      viewport = [1680, 882];
    } else {
      viewport = [1200, 630];
    }
  }

  url = decodeURIComponent(url);

  try {
    if(!isFullUrl(url)) {
      throw new Error(`Invalid \`url\`: ${url}`);
    }

    let urlObj = new URL(url);
    if(!urlObj.origin || !urlObj.origin.endsWith(".netlify.com") && !urlObj.origin.endsWith(".netlify.app")) {
      throw new Error(`Invalid \`url\` (only .netlify.com and .netlify.app URLs allowed): ${url}`);
    }

    if(!viewport || viewport.length !== 2) {
      throw new Error("Incorrect API usage. Expects one of: /:url/ or /:url/:size/ or /:url/:size/:aspectratio/")
    }

    let output = await screenshot(url, format, viewport, dpr);

    // output to Function logs
    console.log(url, format, { viewport }, { size }, { dpr }, { aspectratio });

    return {
      statusCode: 200,
      headers: {
        "content-type": `image/${format}`
      },
      body: output,
      isBase64Encoded: true
    };
  } catch (error) {
    console.log("Error", error);

    return {
      // We need to return 200 here or Firefox won’t display the image
      // HOWEVER a 200 means that if it times out on the first attempt it will stay the default image until the next build.
      statusCode: 200,
      headers: {
        "content-type": "image/svg+xml",
        "x-error-message": error.message
      },
      body: `<svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 40 40" width="${viewport[0]}" height="${viewport[1]}"><path fill="#ddd" d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.11.11 0 0 1-.028-.093l.773-4.726 3.625 3.626-3.77 1.604a.083.083 0 0 1-.033.006h-.015c-.005-.003-.01-.007-.02-.017a1.716 1.716 0 0 0-.495-.381zm5.258-.288l3.876 3.876c.805.806 1.208 1.208 1.355 1.674.022.069.04.138.054.209l-9.263-3.923a.728.728 0 0 0-.015-.006c-.037-.015-.08-.032-.08-.07 0-.038.044-.056.081-.071l.012-.005 3.98-1.684zm5.127 7.003c-.2.376-.59.766-1.25 1.427l-4.37 4.369-5.652-1.177-.03-.006c-.05-.008-.103-.017-.103-.062a1.706 1.706 0 0 0-.655-1.193c-.023-.023-.017-.059-.01-.092 0-.005 0-.01.002-.014l1.063-6.526.004-.022c.006-.05.015-.108.06-.108a1.73 1.73 0 0 0 1.16-.665c.009-.01.015-.021.027-.027.032-.015.07 0 .103.014l9.65 4.082zm-6.625 6.801l-7.186 7.186 1.23-7.56.002-.01c.001-.01.003-.02.006-.029.01-.024.036-.034.061-.044l.012-.005a1.85 1.85 0 0 0 .695-.517c.024-.028.053-.055.09-.06a.09.09 0 0 1 .029 0l5.06 1.04zm-8.707 8.707l-.81.81-8.955-12.942a.424.424 0 0 0-.01-.014c-.014-.019-.029-.038-.026-.06.001-.016.011-.03.022-.042l.01-.013c.027-.04.05-.08.075-.123l.02-.035.003-.003c.014-.024.027-.047.051-.06.021-.01.05-.006.073-.001l9.921 2.046a.164.164 0 0 1 .076.033c.013.013.016.027.019.043a1.757 1.757 0 0 0 1.028 1.175c.028.014.016.045.003.078a.238.238 0 0 0-.015.045c-.125.76-1.197 7.298-1.485 9.063zm-1.692 1.691c-.597.591-.949.904-1.347 1.03a2 2 0 0 1-1.206 0c-.466-.148-.869-.55-1.674-1.356L8.73 28.73l2.349-3.643c.011-.018.022-.034.04-.047.025-.018.061-.01.091 0a2.434 2.434 0 0 0 1.638-.083c.027-.01.054-.017.075.002a.19.19 0 0 1 .028.032L21.95 38.05zM7.863 27.863L5.8 25.8l4.074-1.738a.084.084 0 0 1 .033-.007c.034 0 .054.034.072.065a2.91 2.91 0 0 0 .13.184l.013.016c.012.017.004.034-.008.05l-2.25 3.493zm-2.976-2.976l-2.61-2.61c-.444-.444-.766-.766-.99-1.043l7.936 1.646a.84.84 0 0 0 .03.005c.049.008.103.017.103.063 0 .05-.059.073-.109.092l-.023.01-4.337 1.837zM.831 19.892a2 2 0 0 1 .09-.495c.148-.466.55-.868 1.356-1.674l3.34-3.34a2175.525 2175.525 0 0 0 4.626 6.687c.027.036.057.076.026.106-.146.161-.292.337-.395.528a.16.16 0 0 1-.05.062c-.013.008-.027.005-.042.002H9.78L.831 19.891zm5.68-6.403l4.491-4.491c.422.185 1.958.834 3.332 1.414 1.04.44 1.988.84 2.286.97.03.012.057.024.07.054.008.018.004.041 0 .06a2.003 2.003 0 0 0 .523 1.828c.03.03 0 .073-.026.11l-.014.021-4.56 7.063c-.012.02-.023.037-.043.05-.024.015-.058.008-.086.001a2.274 2.274 0 0 0-.543-.074c-.164 0-.342.03-.522.063h-.001c-.02.003-.038.007-.054-.005a.21.21 0 0 1-.045-.051l-4.808-7.013zm5.398-5.398l5.814-5.814c.805-.805 1.208-1.208 1.674-1.355a2 2 0 0 1 1.206 0c.466.147.869.55 1.674 1.355l1.26 1.26-4.135 6.404a.155.155 0 0 1-.041.048c-.025.017-.06.01-.09 0a2.097 2.097 0 0 0-1.92.37c-.027.028-.067.012-.101-.003-.54-.235-4.74-2.01-5.341-2.265zm12.506-3.676l3.818 3.818-.92 5.698v.015a.135.135 0 0 1-.008.038c-.01.02-.03.024-.05.03a1.83 1.83 0 0 0-.548.273.154.154 0 0 0-.02.017c-.011.012-.022.023-.04.025a.114.114 0 0 1-.043-.007l-5.818-2.472-.011-.005c-.037-.015-.081-.033-.081-.071a2.198 2.198 0 0 0-.31-.915c-.028-.046-.059-.094-.035-.141l4.066-6.303zm-3.932 8.606l5.454 2.31c.03.014.063.027.076.058a.106.106 0 0 1 0 .057c-.016.08-.03.171-.03.263v.153c0 .038-.039.054-.075.069l-.011.004c-.864.369-12.13 5.173-12.147 5.173-.017 0-.035 0-.052-.017-.03-.03 0-.072.027-.11a.76.76 0 0 0 .014-.02l4.482-6.94.008-.012c.026-.042.056-.089.104-.089l.045.007c.102.014.192.027.283.027.68 0 1.31-.331 1.69-.897a.16.16 0 0 1 .034-.04c.027-.02.067-.01.098.004zm-6.246 9.185l12.28-5.237s.018 0 .035.017c.067.067.124.112.179.154l.027.017c.025.014.05.03.052.056 0 .01 0 .016-.002.025L25.756 23.7l-.004.026c-.007.05-.014.107-.061.107a1.729 1.729 0 0 0-1.373.847l-.005.008c-.014.023-.027.045-.05.057-.021.01-.048.006-.07.001l-9.793-2.02c-.01-.002-.152-.519-.163-.52z"/></svg>`,
      isBase64Encoded: false,
    };
  }
}

exports.handler = builder(handler);
