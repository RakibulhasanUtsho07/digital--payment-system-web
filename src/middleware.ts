import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // কুকিজ বা হেডার থেকে টোকেন চেক করা (অথবা ক্লায়েন্ট সাইডে সেভ করা টোকেনের জন্য আমরা কুকি ব্যবহার করতে পারি)
  // ফ্রন্টএন্ডে যদি কুডিতে টোকেন সেভ করেন অথবা লোকালস্টোরেজ চেক করতে চান:
  const token = req.cookies.get("token")?.value;

  // ড্যাশবোর্ড বা প্রটেক্টেড রাউটগুলোতে টোকেন ছাড়া এক্সেস আটকাতে
  if (pathname.startsWith("/dashboard") && !token) {
    // টোকেন না থাকলে লগইন পেজে রিডাইরেক্ট হবে
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// কোন কোন রাউটে এই মিডলওয়্যার কাজ করবে তা এখানে নির্ধারণ করা হয়
export const config = {
  matcher: ["/dashboard/:path*"],
};