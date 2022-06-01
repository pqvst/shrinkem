# shrinkem

just shrink 'em! a simple easy-to-use cli command line tool to shrink/resize and compress images, making them smaller, powered by [sharp](https://sharp.pixelplumbing.com/).

## example

```
$ shrinkem images/ --size 1200
[found] bar.jpg | 4032x3024
[found] foo.jpg | 4032x3024
[found] hello.jpg | 4032x3024
[found] world.jpg | 4032x3024
Found 4 images. Continue? y
[shrink] bar.jpg | 3.7 MB -> 199.5 kB | -94.6%
[shrink] foo.jpg | 3.3 MB -> 195.6 kB | -94.0%
[shrink] hello.jpg | 3.3 MB -> 195.1 kB | -94.1%
[shrink] world.jpg | 3.6 MB -> 190.3 kB | -94.8%
```

or add it to your npm scripts:

```
{
  ...
  "scripts": {
    "shrink": "shrinkrem images/ --size 1200"
  },
  ...
}
```

and run it:

```
npm run shrink
```

## options

```
-v, --verbose     verbose output
-h, --help        print help information
-d, --dry         dry run (do not shrink images)
-k, --keep        keep original images (appends .orig)
-w, --width       max width
-h, --height      max height
-s, --size        max width and height
-e, --ext         image extension to find (multi-arg)
-f, --force       continue without confirmation
-i, --ignore      ignore files/directories (multi-arg)
```

defaults extensions:

```
jpg, jpeg, png, webp
```

refer to [sharp](https://sharp.pixelplumbing.com/) documentation for supported extensions

## license

MIT

## todo

- reduce dependencies
- add tests
