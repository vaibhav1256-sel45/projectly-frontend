// Label + input with an optional leading icon
export default function Field({ label, icon: Icon, ...input }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__box">
        {Icon && <Icon className="field__icon" />}
        <input {...input} />
      </span>
    </label>
  );
}
