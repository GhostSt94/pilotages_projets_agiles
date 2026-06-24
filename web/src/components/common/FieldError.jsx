/** Message d'erreur sous un champ de formulaire. */
export function FieldError({ children }) {
  if (!children) return null;
  return <p className="text-xs text-red-600">{children}</p>;
}
