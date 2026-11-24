import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigateTo } from '../lib/location'

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

/**
 * Site içi bağlantı: gerçek `<a href>` (prerender çıktısında ve JS'siz çalışır, botlar izler), tıklamada sayfa
 * yenilenmeden `navigateTo`. Yeni sekme / değiştirici tuşlu tıklamalar tarayıcıya bırakılır.
 */
export function Link({ href, onClick, target, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || target) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigateTo(href)
    window.scrollTo(0, 0)
  }
  return <a href={href} target={target} onClick={handleClick} {...rest} />
}
