import localFont from "next/font/local";

export const platform = localFont({
  src: [
    {
      path: "../fonts/Platform-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Platform-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Platform-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-platform",
  display: "swap",
});
