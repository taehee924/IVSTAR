import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

// "62%" 같은 퍼센트 수치만 분리 (앞뒤 텍스트는 그대로 유지)
const PERCENT_SPLIT = /(\d{1,3}%)/g;
const PERCENT_EXACT = /^\d{1,3}%$/;

/**
 * 마크다운 렌더 결과에서 퍼센트 수치만 찾아 1.5배 크기로 감싼다.
 * 나머지 텍스트("Chances of reunion:" 등)는 원래 스타일 그대로 유지.
 * 볼드 등 다른 마크다운 요소 안에 있는 퍼센트도 처리하도록 재귀 탐색한다.
 */
export function enlargePercent(node: ReactNode, keyPrefix = "p"): ReactNode {
  if (typeof node === "string") {
    const parts = node.split(PERCENT_SPLIT);
    if (parts.length === 1) return node;
    return parts.map((part, i) =>
      PERCENT_EXACT.test(part) ? (
        <span key={`${keyPrefix}-${i}`} className="text-[1.5em]">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => enlargePercent(child, `${keyPrefix}-${i}`));
  }

  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (el.props?.children !== undefined) {
      return cloneElement(el, {
        children: enlargePercent(el.props.children, keyPrefix),
      });
    }
  }

  return node;
}
