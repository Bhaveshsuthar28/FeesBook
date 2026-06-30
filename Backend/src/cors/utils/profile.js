export function checkProfileCompletion(
  principal
) {
  return Boolean(
    principal &&
    principal.schoolName &&
    principal.address &&
    principal.city &&
    principal.state &&
    principal.district &&
    principal.pinCode &&
    principal.mobile &&
    principal.receiptPrefix &&
    principal.receiptFooter
  );
}