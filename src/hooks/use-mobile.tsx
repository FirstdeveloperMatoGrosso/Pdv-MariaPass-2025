import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Garante que o código só execute no lado do cliente
    if (typeof window === 'undefined') return
    
    const checkIfMobile = () => window.innerWidth < MOBILE_BREAKPOINT;
    
    // Atualiza o estado inicial
    setIsMobile(checkIfMobile())
    
    // Configura o event listener para mudanças de tamanho
    const handleResize = () => {
      setIsMobile(checkIfMobile())
    }
    
    window.addEventListener('resize', handleResize)
    
    // Limpa o event listener ao desmontar
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}
