import { useId } from 'react';

export default function FloatingLabel() {
  const id = useId();
  return (
    <div className="fl-field">
      <input id={id} type="email" placeholder=" " autoComplete="email" />
      <label htmlFor={id}>Email address</label>
    </div>
  );
}
