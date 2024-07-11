export { default } from "apps/records/mod.ts";
export * from "apps/records/mod.ts";

export default function Records(p: Props) {
    console.log("env", {env: p.authToken.get()})
    return fn(p)
}