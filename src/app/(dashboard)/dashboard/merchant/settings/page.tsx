import {
  redirect,
} from "next/navigation";

export default function MerchantSettingsPage() {
  redirect(
    "/dashboard/merchant/settings/general",
  );
}