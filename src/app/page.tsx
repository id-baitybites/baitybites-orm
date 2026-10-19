import PlatformLandingPage from "./platform/page";

export const dynamic = "force-dynamic";

export { metadata } from "./platform/page";

export default function RootPage() {
  return <PlatformLandingPage />;
}