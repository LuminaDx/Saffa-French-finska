# SaffaFrench Finska

A clean, minimal Finska / Mölkky scoreboard app.

## Features
- 1v1, 2v2 and 3-player modes
- Exact 50-point win, bust to 25, 3-strike elimination
- Large scores + number pad (1–12 + Strike)
- Undo
- Rematch with persistent win tally (resets on new game)
- Rules with pin diagram
- Dark mode
- Colour scheme inspired by French blue and South African green/gold

## Local Development
Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy to Cloudflare Pages
1. Push this repo to GitHub.
2. In Cloudflare dashboard → Pages → Create project → Connect to Git.
3. Select the repository.
4. Build settings: Framework preset = None, Build command = (empty), Output directory = `/`
5. Deploy.

Or use Wrangler CLI:

```bash
npx wrangler pages deploy .
```

## Colour Scheme
- French Rugby blue: #001489
- South African Rugby green: #007A53
- Gold accent: #FFB81C
No team names or logos are used.
