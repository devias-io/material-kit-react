# Change Log

## [0.2.0] 2019-05-13

## Updates

- [#5](https://github.com/devias-io/react-material-dashboard/issues/5) Updated to @material-ui to `4.0.0-beta`
- Updated few icons to match @material-ui v4 updates
- Updated React version to `16.8.6` to support React Hooks
- Implemented `jsconfig.json` file and removed `.env` to match React v16.8.6 absolute paths
- Updated Dashboard view top widgets styles and structure
- Updated chart styles and options

## [0.1.1] 2019-05-11

### Updates

- Updated README.md
- Added docs for IE11 polyfill
- Removed unused scss from assets
- Removed unused components from shared components
- Removed `authGuard` since it won't be used in this version
- Removed `auth` service folder since it won't be implemented for this version
- Removed "status" from `ProductCard` component since it was not part of released design
- Changed icon in `Users` widget (ArrowDropDown with ArrowDropUp)

### Fixed bugs

- Fixed charts responsiveness
- Fixed `DisplayMode` component size, when used as a flex child it could grow/shrink
- Fixed `Typography` view responsiveness for small devices
- [#2](https://github.com/devias-io/react-material-dashboard/pull/2) Fixed `ProductCard` component description height

## [0.1.0] 2019-05-02

### Initial commit
