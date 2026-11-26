import { Link, NavLink, useLocation } from 'react-router-dom'

export function TopBar() {
  const { pathname } = useLocation()
  const onPaper = pathname.startsWith('/papers/')
  const onLibraryDetail = pathname.startsWith('/library/') && pathname !== '/library'

  return (
    <header className="topbar">
      <NavLink to="/" className="brand" end>
        <span className="brandmark">✳</span>
        <span>
          ORBIT
          <small>RESEARCH ATLAS</small>
        </span>
      </NavLink>
      <nav className="topnav">
        <NavLink to="/" end>
          研究时间线
        </NavLink>
        <NavLink to="/library">已收录论文</NavLink>
        {onPaper && <span style={{ color: 'var(--text)' }}>论文可视化</span>}
        {onLibraryDetail && <span style={{ color: 'var(--text)' }}>论文详情</span>}
      </nav>
      {onPaper || onLibraryDetail ? (
        <Link className="toplink" to={onPaper ? '/' : '/library'}>
          ← {onPaper ? '返回时间线' : '返回列表'}
        </Link>
      ) : (
        <span className="toplink">拖拽节点 · 悬停读摘要 · 点击进入</span>
      )}
    </header>
  )
}
