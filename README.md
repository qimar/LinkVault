<div align="center">
  <br />
  <h1>🔗 LinkVault</h1>
  <p>
    <strong>One link to rule them all. An open-source, highly customizable, and premium Linktree alternative.</strong>
  </p>
  <p>
    Built with Next.js 14, TailwindCSS, Framer Motion, and Supabase.
  </p>
</div>

<br />

## ✦ Features

LinkVault goes beyond standard link-in-bio tools by offering dynamic aesthetics, rich media integration, and built-in monetization.

- **🎨 Truly Dynamic Appearance Engine:** Completely customize your public page. Instantly change accent colors, add custom background image URLs, and toggle animated CSS particle effects (like snow or stars).
- **🎶 Rich Media Embeds:** Drop a Spotify link in your settings to render a live, inline audio player right on your profile.
- **📈 Built-In Analytics:** Track your audience engagement. A beautiful dashboard chart visualizes your total profile views vs link clicks over the last 7 days.
- **💰 Monetization (Tip Jar):** Connect your Stripe account to automatically render a sleek "Support My Work" block, allowing fans to leave a coffee tip.
- **⚡ Fluid Animations:** Micro-interactions powered by Framer Motion provide a liquid-smooth, premium user experience.
- **🔍 Dynamic SEO:** Automatically generates Open Graph metadata for rich Twitter and iMessage preview cards.

## ✦ Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + custom CSS variable injection
- **Animations:** Framer Motion
- **Database & Auth:** Supabase
- **Charts:** Recharts
- **Icons:** Lucide React

## ✦ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/linkvault.git
cd linkvault
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.

## ✦ Project Structure

- `/app`: Next.js App Router pages and layouts.
  - `/app/page.tsx`: Landing page.
  - `/app/dashboard`: The authenticated dashboard for managing links, appearance, analytics, and monetization.
  - `/app/[username]`: Dynamic route rendering the live public profile.
- `/components`: Reusable UI components (Forms, Sortable Lists, Link Cards).
- `/types`: TypeScript definitions for the database schema.
- `/lib`: Helper utilities (e.g., Supabase client initialization).

## ✦ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
