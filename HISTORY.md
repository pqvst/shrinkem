

## 2.1.0

- Fixing case-insensitive file filter

## 2.0.1

- Fixing bad path
- Adding missing verbose check
- Improving empty message

## 2.0

- [Breaking] Renamed `--extensions` arg to `--ext`
- [Breaking] Extensions are now multi-arg (i.e. `--ext jpg --ext png` instead of `--ext jpg,png`)
- Added `--ignore` arg to exclude any files containing the specified value (multi-arg)
- Fixed support for Windows (using `readdirp` now instead of `glob`)

## 1.0

- Initial release
