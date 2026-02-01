import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Harmonyz" },
    { name: "description", content: "Cool music posters" },
  ];
}

export default function Home() {
  return <Welcome />;
}
