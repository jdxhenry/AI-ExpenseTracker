
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryData } from '../types.ts';

interface Props {
  data: CategoryData[];
  totalSpent: number;
  currencySymbol: string;
  theme: 'light' | 'dark';
}

const RadialExpenseChart: React.FC<Props> = ({ data, totalSpent, currencySymbol, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    
    const isDark = theme === 'dark';
    const primaryTextColor = isDark ? '#FFFFFF' : '#1C1C1E';
    const secondaryTextColor = isDark ? '#8E8E93' : '#8E8E93';
    const centerCircleColor = isDark ? '#1C1C1E' : '#FFFFFF';

    if (data.length === 0) {
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      g.append('circle').attr('r', 100).attr('fill', isDark ? '#2C2C2E' : '#f3f4f6');
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .style('fill', '#9ca3af')
        .text('No activity yet');
      return;
    }

    const radius = Math.min(width, height) / 2.05; 
    const innerRadius = radius * 0.58;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<CategoryData>()
      .value(d => d.amount)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .padAngle(0.02);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('filter', isDark ? 'none' : 'drop-shadow(0px 3px 6px rgba(0,0,0,0.1))');

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '13px')
      .style('font-weight', '800')
      .style('text-shadow', '0px 1px 3px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none')
      .text(d => d.data.percentage > 8 ? `${Math.round(d.data.percentage)}%` : '');

    g.append('circle')
      .attr('r', innerRadius - 2)
      .attr('fill', centerCircleColor)
      .style('filter', isDark ? 'none' : 'drop-shadow(0px 4px 15px rgba(0,0,0,0.06))');

    const central = g.append('g').attr('text-anchor', 'middle');
    
    central.append('text')
      .attr('dy', '-0.6em')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', secondaryTextColor)
      .text('Total Spent');
    
    central.append('text')
      .attr('dy', '0.7em')
      .style('font-size', '28px')
      .style('font-weight', '900')
      .style('fill', primaryTextColor)
      .style('letter-spacing', '-0.5px')
      .text(`${currencySymbol}${Math.round(totalSpent).toLocaleString()}`);

    central.append('text')
      .attr('dy', '3.2em')
      .style('font-size', '12px')
      .style('font-weight', '700')
      .style('fill', '#007AFF')
      .text(`${data.length} categories active`);

  }, [data, totalSpent, currencySymbol, theme]);

  return (
    <div className="flex justify-center items-center w-full aspect-square max-w-[400px] mx-auto overflow-hidden p-2 sm:p-4">
      <svg 
        ref={svgRef} 
        viewBox="0 0 400 400"
        className="w-full h-full"
        aria-label="Radial budget breakdown chart"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default RadialExpenseChart;
