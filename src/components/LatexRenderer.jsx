import { MathJax } from 'better-react-mathjax'

export default function LatexRenderer({ text }) {
  if (!text) return null

  return (
    <MathJax inline dynamic>
      {text}
    </MathJax>
  )
}